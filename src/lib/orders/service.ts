import "server-only";

import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import { hashPayload, hashSecret } from "@/lib/orders/hash";
import {
  buildOrderSnapshot,
  type OrderSnapshot,
  type OrderSnapshotItem,
  OrderSnapshotError,
} from "@/lib/orders/snapshot";
import {
  getItemsHash,
  getQuotePayloadHash,
  type ShippingQuotePayload,
} from "@/lib/orders/quote-contract";
import type { CreateOrderRequest } from "@/lib/orders/schemas";

const ORDER_EXPIRY_MINUTES = 10;

type ExistingOrderRow = {
  orderNumber: string;
  accessTokenHash: string;
  idempotencyPayloadHash: string;
};

type QuoteRow = {
  quoteId: string;
  payloadHash: string;
  itemsHash: string;
  destinationProvinceId: string;
  destinationProvinceName: string;
  destinationCityId: string;
  destinationCityName: string;
  destinationDistrictId: string;
  destinationDistrictName: string;
  courierCode: "jne" | "jnt";
  courierName: string;
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
  shippingCost: number;
  totalProductWeightGram: number;
  packagingWeightGram: number;
  totalWeightGram: number;
};

type CreatedOrderRow = {
  id: string;
  orderNumber: string;
  expiresAt: Date;
};

export type CreateOrderResult = {
  orderNumber: string;
  accessToken: string;
  expiresAt: string;
  reused: boolean;
};

export async function createOrder(
  input: CreateOrderRequest,
): Promise<CreateOrderResult> {
  const idempotencyKeyHash = hashSecret(input.idempotencyKey);
  const idempotencyPayloadHash = hashPayload(normalizeIdempotencyPayload(input));
  const accessToken = input.idempotencyKey;
  const existing = await findOrderByIdempotencyKey(idempotencyKeyHash);

  if (existing) {
    if (existing.idempotencyPayloadHash !== idempotencyPayloadHash) {
      throw new CreateOrderError(
        "IDEMPOTENCY_CONFLICT",
        "Request checkout berbeda memakai idempotency key yang sama.",
        409,
      );
    }

    const replayOrder = await getOrderForReplay(idempotencyKeyHash);

    return {
      orderNumber: replayOrder.orderNumber,
      accessToken,
      expiresAt: replayOrder.expiresAt.toISOString(),
      reused: true,
    };
  }

  const snapshot = await buildOrderSnapshot(input.items);
  const quotePayload: ShippingQuotePayload = {
    items: input.items,
    destination: input.destination,
    totalProductWeightGram: snapshot.totals.totalProductWeightGram,
    packagingWeightGram: snapshot.totals.packagingWeightGram,
    totalWeightGram: snapshot.totals.totalWeightGram,
  };
  const expectedQuotePayloadHash = getQuotePayloadHash(quotePayload);
  const expectedItemsHash = getItemsHash(input.items);
  const accessTokenHash = hashSecret(accessToken);
  const orderNumber = generateOrderNumber();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT public.release_expired_stock_reservations()");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      idempotencyKeyHash,
    ]);

    const existingInTx = await findOrderByIdempotencyKey(
      idempotencyKeyHash,
      client,
    );

    if (existingInTx) {
      if (existingInTx.idempotencyPayloadHash !== idempotencyPayloadHash) {
        throw new CreateOrderError(
          "IDEMPOTENCY_CONFLICT",
          "Request checkout berbeda memakai idempotency key yang sama.",
          409,
        );
      }

      throw new CreateOrderError(
        "IDEMPOTENT_REPLAY",
        "Pesanan ini sudah dibuat dari request sebelumnya.",
        200,
      );
    }

    const quote = await getValidShippingQuote(
      client,
      input.shippingQuoteId,
      expectedQuotePayloadHash,
      expectedItemsHash,
    );
    assertQuoteMatchesRequest(quote, input, snapshot);
    await lockAndAssertStock(client, input.items);

    const totalPayment = snapshot.totals.netSubtotal + quote.shippingCost;
    const orderResult = await client.query<CreatedOrderRow>(
      `
        INSERT INTO orders (
          "orderNumber",
          "accessTokenHash",
          "idempotencyKeyHash",
          "idempotencyPayloadHash",
          "shippingQuoteId",
          "recipientName",
          whatsapp,
          email,
          "destinationProvinceId",
          "destinationProvinceName",
          "destinationCityId",
          "destinationCityName",
          "destinationDistrictId",
          "destinationDistrictName",
          "postalCode",
          address,
          "orderNote",
          "courierCode",
          "courierName",
          "serviceCode",
          "serviceName",
          "estimatedDelivery",
          "shippingCost",
          "grossSubtotal",
          "discountTotal",
          "netSubtotal",
          "totalWeightGram",
          "totalPayment",
          "expiresAt"
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27, $28,
          NOW() + ($29::int * INTERVAL '1 minute')
        )
        RETURNING id, "orderNumber", "expiresAt"
      `,
      [
        orderNumber,
        accessTokenHash,
        idempotencyKeyHash,
        idempotencyPayloadHash,
        quote.quoteId,
        input.recipient.recipientName,
        input.recipient.whatsapp,
        input.recipient.email,
        input.destination.provinceId,
        input.destination.provinceName,
        input.destination.cityId,
        input.destination.cityName,
        input.destination.districtId,
        input.destination.districtName,
        input.recipient.postalCode,
        input.recipient.address,
        input.orderNote || null,
        quote.courierCode,
        quote.courierName,
        quote.serviceCode,
        quote.serviceName,
        quote.estimatedDelivery,
        quote.shippingCost,
        snapshot.totals.grossSubtotal,
        snapshot.totals.discountTotal,
        snapshot.totals.netSubtotal,
        snapshot.totals.totalWeightGram,
        totalPayment,
        ORDER_EXPIRY_MINUTES,
      ],
    );
    const createdOrder = orderResult.rows[0];

    await insertOrderItems(client, createdOrder.id, snapshot.items);
    await insertShipment(client, createdOrder.id, quote);
    await insertPayment(client, createdOrder.id, totalPayment);
    await insertReservations(client, createdOrder.id, snapshot.items);

    await client.query("COMMIT");

    return {
      orderNumber: createdOrder.orderNumber,
      accessToken,
      expiresAt: createdOrder.expiresAt.toISOString(),
      reused: false,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);

    if (error instanceof CreateOrderError) {
      if (error.code === "IDEMPOTENT_REPLAY") {
        const replayOrder = await getOrderForReplay(idempotencyKeyHash);

        return {
          orderNumber: replayOrder.orderNumber,
          accessToken,
          expiresAt: replayOrder.expiresAt.toISOString(),
          reused: true,
        };
      }

      throw error;
    }

    if (error instanceof OrderSnapshotError) {
      throw new CreateOrderError(error.code, error.message, 409);
    }

    throw error;
  } finally {
    client.release();
  }
}

function normalizeIdempotencyPayload(input: CreateOrderRequest) {
  return {
    items: input.items,
    recipient: input.recipient,
    destination: input.destination,
    shippingQuoteId: input.shippingQuoteId,
    orderNote: input.orderNote ?? "",
    termsAccepted: input.termsAccepted,
  };
}

async function findOrderByIdempotencyKey(
  idempotencyKeyHash: string,
  client: PoolClient | typeof db = db,
) {
  const result = await client.query<ExistingOrderRow>(
    `
      SELECT
        "orderNumber",
        "accessTokenHash",
        "idempotencyPayloadHash"
      FROM orders
      WHERE "idempotencyKeyHash" = $1
      LIMIT 1
    `,
    [idempotencyKeyHash],
  );

  return result.rows[0] ?? null;
}

async function getOrderForReplay(idempotencyKeyHash: string) {
  const result = await db.query<{ orderNumber: string; expiresAt: Date }>(
    `
      SELECT "orderNumber", "expiresAt"
      FROM orders
      WHERE "idempotencyKeyHash" = $1
      LIMIT 1
    `,
    [idempotencyKeyHash],
  );
  const order = result.rows[0];

  if (!order) {
    throw new CreateOrderError(
      "IDEMPOTENT_REPLAY_NOT_FOUND",
      "Pesanan sebelumnya belum dapat dibaca. Coba lagi.",
      503,
    );
  }

  return order;
}

async function getValidShippingQuote(
  client: PoolClient,
  quoteId: string,
  expectedPayloadHash: string,
  expectedItemsHash: string,
) {
  const result = await client.query<QuoteRow>(
    `
      SELECT
        "quoteId",
        "payloadHash",
        "itemsHash",
        "destinationProvinceId",
        "destinationProvinceName",
        "destinationCityId",
        "destinationCityName",
        "destinationDistrictId",
        "destinationDistrictName",
        "courierCode",
        "courierName",
        "serviceCode",
        "serviceName",
        "estimatedDelivery",
        "shippingCost",
        "totalProductWeightGram",
        "packagingWeightGram",
        "totalWeightGram"
      FROM checkout_shipping_quotes
      WHERE "quoteId" = $1
        AND "expiresAt" > NOW()
      LIMIT 1
    `,
    [quoteId],
  );
  const quote = result.rows[0];

  if (!quote) {
    throw new CreateOrderError(
      "SHIPPING_QUOTE_EXPIRED",
      "Pilihan ongkir sudah kedaluwarsa. Cek ongkir ulang.",
      409,
    );
  }

  if (
    quote.payloadHash !== expectedPayloadHash ||
    quote.itemsHash !== expectedItemsHash
  ) {
    throw new CreateOrderError(
      "SHIPPING_QUOTE_MISMATCH",
      "Pilihan ongkir tidak cocok dengan keranjang atau alamat terbaru. Cek ongkir ulang.",
      409,
    );
  }

  return quote;
}

function assertQuoteMatchesRequest(
  quote: QuoteRow,
  input: CreateOrderRequest,
  snapshot: OrderSnapshot,
) {
  const destinationMatches =
    quote.destinationProvinceId === input.destination.provinceId &&
    quote.destinationCityId === input.destination.cityId &&
    quote.destinationDistrictId === input.destination.districtId;
  const weightMatches =
    quote.totalProductWeightGram === snapshot.totals.totalProductWeightGram &&
    quote.packagingWeightGram === snapshot.totals.packagingWeightGram &&
    quote.totalWeightGram === snapshot.totals.totalWeightGram;

  if (!destinationMatches || !weightMatches) {
    throw new CreateOrderError(
      "SHIPPING_QUOTE_MISMATCH",
      "Pilihan ongkir tidak cocok dengan keranjang atau alamat terbaru. Cek ongkir ulang.",
      409,
    );
  }
}

async function lockAndAssertStock(
  client: PoolClient,
  items: CreateOrderRequest["items"],
) {
  const variantIds = items.map((item) => item.variantId);
  await client.query(
    `
      SELECT id
      FROM product_variants
      WHERE id = ANY($1::text[])
      ORDER BY id
      FOR UPDATE
    `,
    [variantIds],
  );

  const stockResult = await client.query<{
    variantId: string;
    stock: number;
    reserved: number;
  }>(
    `
      SELECT
        v.id::text AS "variantId",
        v.stock,
        COALESCE(SUM(r.quantity) FILTER (
          WHERE r.status = 'ACTIVE'
            AND r."expiresAt" > NOW()
        ), 0)::int AS reserved
      FROM product_variants v
      LEFT JOIN stock_reservations r ON r."variantId" = v.id
      WHERE v.id = ANY($1::text[])
      GROUP BY v.id, v.stock
    `,
    [variantIds],
  );
  const stockByVariant = new Map(
    stockResult.rows.map((row) => [row.variantId, row]),
  );

  for (const item of items) {
    const stockRow = stockByVariant.get(item.variantId);
    const available = (stockRow?.stock ?? 0) - (stockRow?.reserved ?? 0);

    if (available < item.quantity) {
      throw new CreateOrderError(
        "RESERVATION_FAILED",
        "Stok tersedia berubah karena ada reservasi aktif. Periksa ulang keranjang.",
        409,
      );
    }
  }
}

async function insertOrderItems(
  client: PoolClient,
  orderId: string,
  items: OrderSnapshotItem[],
) {
  await client.query(
    `
      INSERT INTO order_items (
        "orderId",
        "productId",
        "variantId",
        "productName",
        sku,
        "colorName",
        size,
        quantity,
        "normalPrice",
        "discountType",
        "discountValue",
        "discountLabel",
        "salePrice",
        "lineGross",
        "lineDiscount",
        "lineNet",
        "weightGram",
        "lineWeightGram"
      )
      SELECT
        $1,
        item."productId",
        item."variantId",
        item."productName",
        item.sku,
        item."colorName",
        item.size,
        item.quantity,
        item."normalPrice",
        item."discountType",
        item."discountValue",
        item."discountLabel",
        item."salePrice",
        item."lineGross",
        item."lineDiscount",
        item."lineNet",
        item."weightGram",
        item."lineWeightGram"
      FROM jsonb_to_recordset($2::jsonb) AS item(
        "productId" text,
        "variantId" text,
        "productName" text,
        sku text,
        "colorName" text,
        size text,
        quantity int,
        "normalPrice" int,
        "discountType" text,
        "discountValue" int,
        "discountLabel" text,
        "salePrice" int,
        "lineGross" int,
        "lineDiscount" int,
        "lineNet" int,
        "weightGram" int,
        "lineWeightGram" int
      )
    `,
    [orderId, JSON.stringify(items)],
  );
}

async function insertShipment(
  client: PoolClient,
  orderId: string,
  quote: QuoteRow,
) {
  await client.query(
    `
      INSERT INTO shipments (
        "orderId",
        "courierCode",
        "courierName",
        "serviceCode",
        "serviceName",
        "estimatedDelivery",
        "shippingCost"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      orderId,
      quote.courierCode,
      quote.courierName,
      quote.serviceCode,
      quote.serviceName,
      quote.estimatedDelivery,
      quote.shippingCost,
    ],
  );
}

async function insertPayment(
  client: PoolClient,
  orderId: string,
  amount: number,
) {
  await client.query(
    `
      INSERT INTO payments ("orderId", amount, "expiresAt")
      VALUES ($1, $2, NOW() + ($3::int * INTERVAL '1 minute'))
    `,
    [orderId, amount, ORDER_EXPIRY_MINUTES],
  );
}

async function insertReservations(
  client: PoolClient,
  orderId: string,
  items: OrderSnapshotItem[],
) {
  const reservationResult = await client.query<{ id: string; variantId: string }>(
    `
      INSERT INTO stock_reservations (
        "orderId",
        "variantId",
        quantity,
        "expiresAt"
      )
      SELECT
        $1,
        item."variantId",
        item.quantity,
        NOW() + ($2::int * INTERVAL '1 minute')
      FROM jsonb_to_recordset($3::jsonb) AS item(
        "variantId" text,
        quantity int
      )
      RETURNING id, "variantId"
    `,
    [
      orderId,
      ORDER_EXPIRY_MINUTES,
      JSON.stringify(
        items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      ),
    ],
  );
  const reservationByVariant = new Map(
    reservationResult.rows.map((row) => [row.variantId, row.id]),
  );

  await client.query(
    `
      INSERT INTO inventory_movements (
        "variantId",
        "orderId",
        "reservationId",
        type,
        "quantityDelta",
        note
      )
      SELECT
        item."variantId",
        $1,
        item."reservationId",
        'RESERVATION_CREATED',
        -item.quantity,
        'Reservasi stok checkout 10 menit'
      FROM jsonb_to_recordset($2::jsonb) AS item(
        "variantId" text,
        "reservationId" text,
        quantity int
      )
    `,
    [
      orderId,
      JSON.stringify(
        items.map((item) => ({
          variantId: item.variantId,
          reservationId: reservationByVariant.get(item.variantId),
          quantity: item.quantity,
        })),
      ),
    ],
  );
}

function generateOrderNumber() {
  const date = new Date();
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const randomPart = globalThis.crypto.randomUUID().slice(0, 8).toUpperCase();

  return `BLS-${datePart}-${randomPart}`;
}

export class CreateOrderError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "CreateOrderError";
    this.code = code;
    this.status = status;
  }
}
