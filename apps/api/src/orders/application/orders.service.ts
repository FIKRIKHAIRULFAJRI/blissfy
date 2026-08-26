import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import {
  getItemsHash,
  getQuotePayloadHash,
  type ShippingQuotePayload,
} from '../../shipping/domain/quote-contract';

import {
  createOrderRequestSchema,
  type CreateOrderRequest,
} from '../domain/order.schema';

import {
  CreateOrderError,
  OrderSnapshotError,
  type CreateOrderResult,
  type OrderSnapshot,
} from '../domain/order.types';

import { hashPayload, hashSecret } from '../domain/hash';

import {
  OrderRepository,
  type ShippingQuoteRow,
} from '../infrastructure/order.repository';

import { OrderSnapshotService } from './order-snapshot.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orderRepository: OrderRepository,
    private readonly orderSnapshotService: OrderSnapshotService,
  ) {}

  async create(body: unknown): Promise<{
    ok: true;
    order: CreateOrderResult;
  }> {
    const parsed = createOrderRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new HttpException(
        {
          ok: false,
          code: 'ORDER_BAD_REQUEST',
          message: 'Data checkout belum lengkap atau tidak valid.',
          issues: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    try {
      const order = await this.createOrder(parsed.data);

      return {
        ok: true,
        order,
      };
    } catch (error) {
      throwOrderError(error);
    }
  }

  private async createOrder(
    input: CreateOrderRequest,
  ): Promise<CreateOrderResult> {
    const idempotencyKeyHash = hashSecret(input.idempotencyKey);

    const idempotencyPayloadHash = hashPayload(
      normalizeIdempotencyPayload(input),
    );

    const accessToken = input.idempotencyKey;

    const existing =
      await this.orderRepository.findOrderByIdempotencyKey(idempotencyKeyHash);

    if (existing) {
      assertIdempotencyPayload(
        existing.idempotencyPayloadHash,
        idempotencyPayloadHash,
      );

      return {
        orderNumber: existing.orderNumber,

        accessToken,

        expiresAt: existing.expiresAt.toISOString(),

        reused: true,
      };
    }

    const snapshot = await this.orderSnapshotService.build(input.items);

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

    return this.databaseService.withTransaction(async (client) => {
      await this.orderRepository.releaseExpiredReservations(client);

      await this.orderRepository.acquireIdempotencyLock(
        client,
        idempotencyKeyHash,
      );

      const existingInTransaction =
        await this.orderRepository.findOrderByIdempotencyKey(
          idempotencyKeyHash,
          client,
        );

      if (existingInTransaction) {
        assertIdempotencyPayload(
          existingInTransaction.idempotencyPayloadHash,
          idempotencyPayloadHash,
        );

        return {
          orderNumber: existingInTransaction.orderNumber,

          accessToken,

          expiresAt: existingInTransaction.expiresAt.toISOString(),

          reused: true,
        };
      }

      const quote = await this.orderRepository.findValidShippingQuote(
        client,
        input.shippingQuoteId,
      );

      assertShippingQuote(
        quote,
        input,
        snapshot,
        expectedQuotePayloadHash,
        expectedItemsHash,
      );

      const variantIds = Array.from(
        new Set(input.items.map((item) => item.variantId)),
      );

      await this.orderRepository.lockVariants(client, variantIds);

      const lockedStock = await this.orderRepository.findLockedStock(
        client,
        variantIds,
      );

      assertLockedStock(lockedStock, input.items);

      const createdOrder = await this.orderRepository.createOrder(client, {
        request: input,
        snapshot,
        shippingQuote: quote,

        orderNumber,

        accessTokenHash,
        idempotencyKeyHash,
        idempotencyPayloadHash,
      });

      await this.orderRepository.insertOrderItems(
        client,
        createdOrder.id,
        snapshot.items,
      );

      await this.orderRepository.insertShipment(client, createdOrder.id, quote);

      const totalPayment = snapshot.totals.netSubtotal + quote.shippingCost;

      await this.orderRepository.insertPayment(
        client,
        createdOrder.id,
        totalPayment,
      );

      await this.orderRepository.insertReservations(
        client,
        createdOrder.id,
        snapshot.items,
      );

      return {
        orderNumber: createdOrder.orderNumber,

        accessToken,

        expiresAt: createdOrder.expiresAt.toISOString(),

        reused: false,
      };
    });
  }
}

function normalizeIdempotencyPayload(input: CreateOrderRequest) {
  return {
    items: input.items,

    recipient: input.recipient,

    destination: input.destination,

    shippingQuoteId: input.shippingQuoteId,

    orderNote: input.orderNote ?? '',

    termsAccepted: input.termsAccepted,
  };
}

function assertIdempotencyPayload(existingHash: string, requestedHash: string) {
  if (existingHash !== requestedHash) {
    throw new CreateOrderError(
      'IDEMPOTENCY_CONFLICT',

      'Request checkout berbeda memakai idempotency key yang sama.',

      409,
    );
  }
}

function assertShippingQuote(
  quote: ShippingQuoteRow | null,

  input: CreateOrderRequest,

  snapshot: OrderSnapshot,

  expectedPayloadHash: string,

  expectedItemsHash: string,
): asserts quote is ShippingQuoteRow {
  if (!quote) {
    throw new CreateOrderError(
      'SHIPPING_QUOTE_EXPIRED',

      'Pilihan ongkir sudah kedaluwarsa. Cek ongkir ulang.',

      409,
    );
  }

  if (
    quote.payloadHash !== expectedPayloadHash ||
    quote.itemsHash !== expectedItemsHash
  ) {
    throw new CreateOrderError(
      'SHIPPING_QUOTE_MISMATCH',

      'Pilihan ongkir tidak cocok dengan keranjang atau alamat terbaru. Cek ongkir ulang.',

      409,
    );
  }

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
      'SHIPPING_QUOTE_MISMATCH',

      'Pilihan ongkir tidak cocok dengan keranjang atau alamat terbaru. Cek ongkir ulang.',

      409,
    );
  }
}

function assertLockedStock(
  rows: Array<{
    variantId: string;
    stock: number;
    reserved: number;
  }>,

  items: CreateOrderRequest['items'],
) {
  const stockByVariant = new Map(rows.map((row) => [row.variantId, row]));

  const requestedByVariant = new Map<string, number>();

  for (const item of items) {
    requestedByVariant.set(
      item.variantId,

      (requestedByVariant.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, requestedQuantity] of requestedByVariant) {
    const stockRow = stockByVariant.get(variantId);

    const available = Math.max(
      0,
      (stockRow?.stock ?? 0) - (stockRow?.reserved ?? 0),
    );

    if (available < requestedQuantity) {
      throw new CreateOrderError(
        'RESERVATION_FAILED',

        'Stok tersedia berubah karena ada reservasi aktif. Periksa ulang keranjang.',

        409,
      );
    }
  }
}

function generateOrderNumber() {
  const date = new Date();

  const datePart = [
    date.getUTCFullYear(),

    String(date.getUTCMonth() + 1).padStart(2, '0'),

    String(date.getUTCDate()).padStart(2, '0'),
  ].join('');

  const randomPart = globalThis.crypto.randomUUID().slice(0, 8).toUpperCase();

  return `BLS-${datePart}-${randomPart}`;
}

function throwOrderError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }

  if (error instanceof CreateOrderError) {
    throw new HttpException(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },
      error.status,
    );
  }

  if (error instanceof OrderSnapshotError) {
    throw new HttpException(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },
      409,
    );
  }

  console.error('Order creation failed', {
    name: error instanceof Error ? error.name : 'UnknownError',
  });

  throw new ServiceUnavailableException({
    ok: false,
    code: 'ORDER_UNAVAILABLE',
    message: 'Pesanan belum dapat dibuat. Coba lagi.',
  });
}
