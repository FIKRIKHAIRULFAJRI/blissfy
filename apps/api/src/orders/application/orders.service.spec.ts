import { HttpException } from '@nestjs/common';
import {
  getItemsHash,
  getQuotePayloadHash,
  type ShippingQuotePayload,
} from '../../shipping/domain/quote-contract';
import { hashPayload } from '../domain/hash';
import type { CreateOrderRequest } from '../domain/order.schema';
import type { OrderSnapshot } from '../domain/order.types';
import type { ShippingQuoteRow } from '../infrastructure/order.repository';
import { OrdersService } from './orders.service';

type CreateOrderRepositoryInput = {
  request: CreateOrderRequest;
  snapshot: OrderSnapshot;
  shippingQuote: ShippingQuoteRow;

  orderNumber: string;

  accessTokenHash: string;
  idempotencyKeyHash: string;
  idempotencyPayloadHash: string;
};

describe('OrdersService', () => {
  const transactionClient = {};

  const databaseServiceMock = {
    withTransaction: jest.fn(),
  };

  const orderRepositoryMock = {
    findOrderByIdempotencyKey: jest.fn(),

    releaseExpiredReservations: jest.fn(),

    acquireIdempotencyLock: jest.fn(),

    findValidShippingQuote: jest.fn(),

    lockVariants: jest.fn(),

    findLockedStock: jest.fn(),

    createOrder: jest.fn(),

    insertOrderItems: jest.fn(),

    insertShipment: jest.fn(),

    insertPayment: jest.fn(),

    insertReservations: jest.fn(),
  };

  const orderSnapshotServiceMock = {
    build: jest.fn(),
  };

  let service: OrdersService;

  const validRequest: CreateOrderRequest = {
    idempotencyKey: 'checkout-idempotency-key-123456',

    items: [
      {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 1,
      },
    ],

    recipient: {
      recipientName: 'Fikri Khairul',
      whatsapp: '081234567890',
      email: 'fikri@example.com',

      province: 'JAWA TENGAH',
      city: 'BANYUMAS',
      district: 'PURWOKERTO SELATAN',

      postalCode: '53147',

      address: 'Jl. Contoh No. 10 Purwokerto Selatan',
    },

    orderNote: 'Tolong dikemas rapi.',

    shippingQuoteId: 'shipping-quote-id-123456789',

    destination: {
      provinceId: '12',
      provinceName: 'JAWA TENGAH',

      cityId: '591',
      cityName: 'BANYUMAS',

      districtId: '1234',
      districtName: 'PURWOKERTO SELATAN',
    },

    termsAccepted: true,
  };

  const snapshot: OrderSnapshot = {
    items: [
      {
        productId: 'product-1',
        variantId: 'variant-1',

        productName: 'Easy Straight Trouser',

        sku: 'EST-CHR-M',
        colorName: 'Charcoal',
        size: 'M',

        quantity: 1,

        normalPrice: 200000,

        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountLabel: '-10%',

        salePrice: 180000,

        lineGross: 200000,
        lineDiscount: 20000,
        lineNet: 180000,

        weightGram: 300,
        lineWeightGram: 300,
      },
    ],

    totals: {
      grossSubtotal: 200000,
      discountTotal: 20000,
      netSubtotal: 180000,

      totalProductWeightGram: 300,
      packagingWeightGram: 100,
      totalWeightGram: 400,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new OrdersService(
      databaseServiceMock as never,
      orderRepositoryMock as never,
      orderSnapshotServiceMock as never,
    );
  });

  it('should reject invalid order payload', async () => {
    try {
      await service.create({});

      throw new Error('Expected invalid request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);

      const exception = error as HttpException;

      expect(exception.getStatus()).toBe(400);

      expect(exception.getResponse()).toMatchObject({
        ok: false,
        code: 'ORDER_BAD_REQUEST',
      });
    }

    expect(orderSnapshotServiceMock.build).not.toHaveBeenCalled();

    expect(databaseServiceMock.withTransaction).not.toHaveBeenCalled();
  });

  it('should replay an existing order when idempotency payload matches', async () => {
    const expectedPayloadHash = hashPayload({
      items: validRequest.items,

      recipient: validRequest.recipient,

      destination: validRequest.destination,

      shippingQuoteId: validRequest.shippingQuoteId,

      orderNote: validRequest.orderNote,

      termsAccepted: validRequest.termsAccepted,
    });

    orderRepositoryMock.findOrderByIdempotencyKey.mockResolvedValue({
      orderNumber: 'BLS-20260826-ABC12345',

      idempotencyPayloadHash: expectedPayloadHash,

      expiresAt: new Date('2026-08-26T14:00:00.000Z'),
    });

    const result = await service.create(validRequest);

    expect(result).toEqual({
      ok: true,

      order: {
        orderNumber: 'BLS-20260826-ABC12345',

        accessToken: validRequest.idempotencyKey,

        expiresAt: '2026-08-26T14:00:00.000Z',

        reused: true,
      },
    });

    expect(orderSnapshotServiceMock.build).not.toHaveBeenCalled();

    expect(databaseServiceMock.withTransaction).not.toHaveBeenCalled();
  });

  it('should reject reuse of idempotency key with different payload', async () => {
    orderRepositoryMock.findOrderByIdempotencyKey.mockResolvedValue({
      orderNumber: 'BLS-20260826-ABC12345',

      idempotencyPayloadHash: 'different-payload-hash',

      expiresAt: new Date('2026-08-26T14:00:00.000Z'),
    });

    try {
      await service.create(validRequest);

      throw new Error('Expected idempotency conflict');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);

      const exception = error as HttpException;

      expect(exception.getStatus()).toBe(409);

      expect(exception.getResponse()).toMatchObject({
        ok: false,

        code: 'IDEMPOTENCY_CONFLICT',
      });
    }

    expect(databaseServiceMock.withTransaction).not.toHaveBeenCalled();
  });

  it('should create order, payment, shipment, and stock reservation in one transaction', async () => {
    const quote = createMatchingShippingQuote(validRequest, snapshot, 15000);

    orderRepositoryMock.findOrderByIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    orderSnapshotServiceMock.build.mockResolvedValue(snapshot);

    orderRepositoryMock.findValidShippingQuote.mockResolvedValue(quote);

    orderRepositoryMock.findLockedStock.mockResolvedValue([
      {
        variantId: 'variant-1',

        stock: 10,
        reserved: 2,
      },
    ]);

    orderRepositoryMock.createOrder.mockResolvedValue({
      id: 'order-id-1',

      orderNumber: 'BLS-20260826-ABC12345',

      expiresAt: new Date('2026-08-26T14:00:00.000Z'),
    });

    databaseServiceMock.withTransaction.mockImplementation(
      async (callback: (client: unknown) => Promise<unknown>) =>
        callback(transactionClient),
    );

    const result = await service.create(validRequest);

    expect(result).toEqual({
      ok: true,

      order: {
        orderNumber: 'BLS-20260826-ABC12345',

        accessToken: validRequest.idempotencyKey,

        expiresAt: '2026-08-26T14:00:00.000Z',

        reused: false,
      },
    });

    expect(orderRepositoryMock.releaseExpiredReservations).toHaveBeenCalledWith(
      transactionClient,
    );

    expect(orderRepositoryMock.acquireIdempotencyLock).toHaveBeenCalledWith(
      transactionClient,
      expect.any(String),
    );

    expect(orderRepositoryMock.findValidShippingQuote).toHaveBeenCalledWith(
      transactionClient,
      validRequest.shippingQuoteId,
    );

    expect(orderRepositoryMock.lockVariants).toHaveBeenCalledWith(
      transactionClient,
      ['variant-1'],
    );

    expect(orderRepositoryMock.createOrder).toHaveBeenCalledTimes(1);

    const createOrderCall: unknown =
      orderRepositoryMock.createOrder.mock.calls[0];

    const [calledClient, createOrderInput] = createOrderCall as [
      unknown,
      CreateOrderRepositoryInput,
    ];

    expect(calledClient).toBe(transactionClient);

    expect(createOrderInput.request).toEqual(validRequest);

    expect(createOrderInput.snapshot).toEqual(snapshot);

    expect(createOrderInput.shippingQuote).toEqual(quote);

    expect(createOrderInput.orderNumber).toMatch(/^BLS-\d{8}-[A-Z0-9]{8}$/);

    expect(typeof createOrderInput.accessTokenHash).toBe('string');

    expect(createOrderInput.accessTokenHash.length).toBeGreaterThan(0);

    expect(typeof createOrderInput.idempotencyKeyHash).toBe('string');

    expect(createOrderInput.idempotencyKeyHash.length).toBeGreaterThan(0);

    expect(typeof createOrderInput.idempotencyPayloadHash).toBe('string');

    expect(createOrderInput.idempotencyPayloadHash.length).toBeGreaterThan(0);

    expect(orderRepositoryMock.insertOrderItems).toHaveBeenCalledWith(
      transactionClient,
      'order-id-1',
      snapshot.items,
    );

    expect(orderRepositoryMock.insertShipment).toHaveBeenCalledWith(
      transactionClient,
      'order-id-1',
      quote,
    );

    expect(orderRepositoryMock.insertPayment).toHaveBeenCalledWith(
      transactionClient,
      'order-id-1',

      // 180.000 + 15.000
      195000,
    );

    expect(orderRepositoryMock.insertReservations).toHaveBeenCalledWith(
      transactionClient,
      'order-id-1',
      snapshot.items,
    );
  });

  it('should reject duplicate variant quantities when locked available stock is insufficient', async () => {
    const duplicateRequest: CreateOrderRequest = {
      ...validRequest,

      idempotencyKey: 'checkout-duplicate-key-123456',

      items: [
        {
          productId: 'product-1',

          variantId: 'variant-1',

          quantity: 4,
        },

        {
          productId: 'product-1',

          variantId: 'variant-1',

          quantity: 4,
        },
      ],
    };

    const duplicateSnapshot: OrderSnapshot = {
      ...snapshot,

      items: [
        {
          ...snapshot.items[0],
          quantity: 4,

          lineGross: 800000,
          lineDiscount: 80000,
          lineNet: 720000,

          lineWeightGram: 1200,
        },

        {
          ...snapshot.items[0],
          quantity: 4,

          lineGross: 800000,
          lineDiscount: 80000,
          lineNet: 720000,

          lineWeightGram: 1200,
        },
      ],

      totals: {
        grossSubtotal: 1600000,
        discountTotal: 160000,
        netSubtotal: 1440000,

        totalProductWeightGram: 2400,
        packagingWeightGram: 100,
        totalWeightGram: 2500,
      },
    };

    const quote = createMatchingShippingQuote(
      duplicateRequest,
      duplicateSnapshot,
      20000,
    );

    orderRepositoryMock.findOrderByIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    orderSnapshotServiceMock.build.mockResolvedValue(duplicateSnapshot);

    orderRepositoryMock.findValidShippingQuote.mockResolvedValue(quote);

    orderRepositoryMock.findLockedStock.mockResolvedValue([
      {
        variantId: 'variant-1',

        stock: 10,

        // available hanya 7
        reserved: 3,
      },
    ]);

    databaseServiceMock.withTransaction.mockImplementation(
      async (callback: (client: unknown) => Promise<unknown>) =>
        callback(transactionClient),
    );

    try {
      await service.create(duplicateRequest);

      throw new Error('Expected reservation failure');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);

      const exception = error as HttpException;

      expect(exception.getStatus()).toBe(409);

      expect(exception.getResponse()).toMatchObject({
        ok: false,

        code: 'RESERVATION_FAILED',
      });
    }

    expect(orderRepositoryMock.createOrder).not.toHaveBeenCalled();

    expect(orderRepositoryMock.insertReservations).not.toHaveBeenCalled();
  });
});

function createMatchingShippingQuote(
  request: Pick<CreateOrderRequest, 'items' | 'destination'>,

  snapshot: OrderSnapshot,

  shippingCost: number,
): ShippingQuoteRow {
  const payload: ShippingQuotePayload = {
    items: request.items,

    destination: request.destination,

    totalProductWeightGram: snapshot.totals.totalProductWeightGram,

    packagingWeightGram: snapshot.totals.packagingWeightGram,

    totalWeightGram: snapshot.totals.totalWeightGram,
  };

  return {
    quoteId: 'shipping-quote-id-123456789',

    payloadHash: getQuotePayloadHash(payload),

    itemsHash: getItemsHash(request.items),

    destinationProvinceId: request.destination.provinceId,

    destinationProvinceName: request.destination.provinceName,

    destinationCityId: request.destination.cityId,

    destinationCityName: request.destination.cityName,

    destinationDistrictId: request.destination.districtId,

    destinationDistrictName: request.destination.districtName,

    courierCode: 'jne',
    courierName: 'JNE',

    serviceCode: 'REG',
    serviceName: 'Layanan Reguler',

    estimatedDelivery: '3 day',

    shippingCost,

    totalProductWeightGram: snapshot.totals.totalProductWeightGram,

    packagingWeightGram: snapshot.totals.packagingWeightGram,

    totalWeightGram: snapshot.totals.totalWeightGram,
  };
}
