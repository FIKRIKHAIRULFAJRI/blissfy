import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import type { DiscountForPricing } from '../../products/domain/product-pricing';
import type { CreateOrderRequest } from '../domain/order.schema';
import type { OrderSnapshot, OrderSnapshotItem } from '../domain/order.types';

export type OrderCatalogRow = {
  variantId: string;
  productId: string;
  productName: string;
  productIsActive: boolean;

  normalPrice: number;

  sku: string;
  colorName: string;
  size: string;

  weightGram: number;
  variantIsActive: boolean;

  packagingWeightGram: number | null;
};

export type OrderDiscountRow = DiscountForPricing & {
  productId: string;
};

export type ExistingOrderRow = {
  orderNumber: string;
  idempotencyPayloadHash: string;
  expiresAt: Date;
};

export type ShippingQuoteRow = {
  quoteId: string;

  payloadHash: string;
  itemsHash: string;

  destinationProvinceId: string;
  destinationProvinceName: string;

  destinationCityId: string;
  destinationCityName: string;

  destinationDistrictId: string;
  destinationDistrictName: string;

  courierCode: 'jne' | 'jnt';
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

export type LockedStockRow = {
  variantId: string;
  stock: number;
  reserved: number;
};

const ORDER_EXPIRY_MINUTES = 10;

@Injectable()
export class OrderRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findCatalogRows(variantIds: string[]): Promise<OrderCatalogRow[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.query<OrderCatalogRow>(
      `
          SELECT
            v.id::text AS "variantId",
            v."productId"::text AS "productId",
            p.name AS "productName",
            p."isActive" AS "productIsActive",
            p."normalPrice",
            v.sku,
            v."colorName",
            v.size,
            v."weightGram",
            v."isActive" AS "variantIsActive",
            settings."defaultPackagingWeightGram"
              AS "packagingWeightGram"
          FROM product_variants v

          INNER JOIN products p
            ON p.id = v."productId"

          LEFT JOIN LATERAL (
            SELECT
              "defaultPackagingWeightGram"
            FROM store_settings
            ORDER BY "createdAt" ASC
            LIMIT 1
          ) settings ON true

          WHERE v.id::text = ANY($1::text[])
        `,
      [variantIds],
    );

    return result.rows;
  }

  async findDiscounts(productIds: string[]): Promise<OrderDiscountRow[]> {
    if (productIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.query<OrderDiscountRow>(
      `
          SELECT
            "productId"::text AS "productId",
            type::text AS type,
            value,
            "startsAt",
            "endsAt",
            "isActive"
          FROM discounts
          WHERE "productId"::text = ANY($1::text[])
            AND "isActive" = true
          ORDER BY "startsAt" DESC
        `,
      [productIds],
    );

    return result.rows;
  }

  async findOrderByIdempotencyKey(
    idempotencyKeyHash: string,
    client?: PoolClient,
  ): Promise<ExistingOrderRow | null> {
    const query = `
      SELECT
        "orderNumber",
        "idempotencyPayloadHash",
        "expiresAt"
      FROM orders
      WHERE "idempotencyKeyHash" = $1
      LIMIT 1
    `;

    const values = [idempotencyKeyHash];

    if (client) {
      const result = await client.query<ExistingOrderRow>(query, values);

      return result.rows[0] ?? null;
    }

    const result = await this.databaseService.query<ExistingOrderRow>(
      query,
      values,
    );

    return result.rows[0] ?? null;
  }

  async releaseExpiredReservations(client: PoolClient) {
    await client.query(
      `
        SELECT
          public.release_expired_stock_reservations()
      `,
    );
  }

  async acquireIdempotencyLock(client: PoolClient, idempotencyKeyHash: string) {
    await client.query(
      `
        SELECT
          pg_advisory_xact_lock(
            hashtext($1)
          )
      `,
      [idempotencyKeyHash],
    );
  }

  async findValidShippingQuote(
    client: PoolClient,
    quoteId: string,
  ): Promise<ShippingQuoteRow | null> {
    const result = await client.query<ShippingQuoteRow>(
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

    return result.rows[0] ?? null;
  }

  async lockVariants(client: PoolClient, variantIds: string[]) {
    await client.query(
      `
        SELECT id
        FROM product_variants
        WHERE id::text = ANY($1::text[])
        ORDER BY id
        FOR UPDATE
      `,
      [variantIds],
    );
  }

  async findLockedStock(
    client: PoolClient,
    variantIds: string[],
  ): Promise<LockedStockRow[]> {
    const result = await client.query<LockedStockRow>(
      `
          SELECT
            v.id::text AS "variantId",

            v.stock,

            COALESCE(
              SUM(r.quantity) FILTER (
                WHERE r.status = 'ACTIVE'
                  AND r."expiresAt" > NOW()
              ),
              0
            )::int AS reserved

          FROM product_variants v

          LEFT JOIN stock_reservations r
            ON r."variantId" = v.id

          WHERE v.id::text =
            ANY($1::text[])

          GROUP BY
            v.id,
            v.stock
        `,
      [variantIds],
    );

    return result.rows;
  }

  async createOrder(
    client: PoolClient,
    input: {
      request: CreateOrderRequest;
      snapshot: OrderSnapshot;

      shippingQuote: ShippingQuoteRow;

      orderNumber: string;

      accessTokenHash: string;
      idempotencyKeyHash: string;
      idempotencyPayloadHash: string;
    },
  ): Promise<CreatedOrderRow> {
    const {
      request,
      snapshot,
      shippingQuote,
      orderNumber,
      accessTokenHash,
      idempotencyKeyHash,
      idempotencyPayloadHash,
    } = input;

    const totalPayment =
      snapshot.totals.netSubtotal + shippingQuote.shippingCost;

    const result = await client.query<CreatedOrderRow>(
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
            $9, $10,
            $11, $12,
            $13, $14,
            $15, $16, $17,
            $18, $19,
            $20, $21,
            $22, $23,
            $24, $25, $26,
            $27, $28,

            NOW() + (
              $29::int *
              INTERVAL '1 minute'
            )
          )

          RETURNING
            id,
            "orderNumber",
            "expiresAt"
        `,
      [
        orderNumber,
        accessTokenHash,
        idempotencyKeyHash,
        idempotencyPayloadHash,
        shippingQuote.quoteId,

        request.recipient.recipientName,
        request.recipient.whatsapp,
        request.recipient.email,

        request.destination.provinceId,
        request.destination.provinceName,

        request.destination.cityId,
        request.destination.cityName,

        request.destination.districtId,
        request.destination.districtName,

        request.recipient.postalCode,
        request.recipient.address,
        request.orderNote || null,

        shippingQuote.courierCode,
        shippingQuote.courierName,

        shippingQuote.serviceCode,
        shippingQuote.serviceName,

        shippingQuote.estimatedDelivery,
        shippingQuote.shippingCost,

        snapshot.totals.grossSubtotal,
        snapshot.totals.discountTotal,
        snapshot.totals.netSubtotal,

        snapshot.totals.totalWeightGram,
        totalPayment,

        ORDER_EXPIRY_MINUTES,
      ],
    );

    return result.rows[0];
  }

  async insertOrderItems(
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

        FROM jsonb_to_recordset(
          $2::jsonb
        ) AS item(
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

  async insertShipment(
    client: PoolClient,
    orderId: string,
    quote: ShippingQuoteRow,
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

        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7
        )
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

  async insertPayment(client: PoolClient, orderId: string, amount: number) {
    await client.query(
      `
        INSERT INTO payments (
          "orderId",
          amount,
          "expiresAt"
        )

        VALUES (
          $1,
          $2,

          NOW() + (
            $3::int *
            INTERVAL '1 minute'
          )
        )
      `,
      [orderId, amount, ORDER_EXPIRY_MINUTES],
    );
  }

  async insertReservations(
    client: PoolClient,
    orderId: string,
    items: OrderSnapshotItem[],
  ) {
    const aggregated = aggregateReservationItems(items);

    const reservationResult = await client.query<{
      id: string;
      variantId: string;
    }>(
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

            NOW() + (
              $2::int *
              INTERVAL '1 minute'
            )

          FROM jsonb_to_recordset(
            $3::jsonb
          ) AS item(
            "variantId" text,
            quantity int
          )

          RETURNING
            id,
            "variantId"
        `,
      [orderId, ORDER_EXPIRY_MINUTES, JSON.stringify(aggregated)],
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

        FROM jsonb_to_recordset(
          $2::jsonb
        ) AS item(
          "variantId" text,
          "reservationId" text,
          quantity int
        )
      `,
      [
        orderId,

        JSON.stringify(
          aggregated.map((item) => ({
            variantId: item.variantId,

            reservationId: reservationByVariant.get(item.variantId),

            quantity: item.quantity,
          })),
        ),
      ],
    );
  }
}

function aggregateReservationItems(items: OrderSnapshotItem[]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.variantId,

      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  return Array.from(quantities.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}
