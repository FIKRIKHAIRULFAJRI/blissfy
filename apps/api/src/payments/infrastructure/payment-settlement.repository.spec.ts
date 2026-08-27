import type {
  PaymentStatus,
  PaymentStatusResult,
} from '../domain/payment-gateway';

import { PaymentSettlementRepository } from './payment-settlement.repository';

type MockQueryResult = {
  rows: unknown[];
};

type MockQuery = (sql: string, params?: unknown[]) => Promise<MockQueryResult>;

type MockClient = {
  query: jest.MockedFunction<MockQuery>;
};

type TransactionCallback = (client: MockClient) => Promise<unknown>;

type MockWithTransaction = (callback: TransactionCallback) => Promise<unknown>;

function createGatewayStatus(status: PaymentStatus): PaymentStatusResult {
  return {
    provider: 'mock',

    providerOrderId: 'BLS-TEST-001',

    providerTransactionId: 'mock-BLS-TEST-001',

    status,

    paidAt: status === 'PAID' ? '2026-08-27T15:00:00.000Z' : null,

    rawResponse: {
      simulated: true,
      status,
    },
  };
}

function getExecutedSql(client: MockClient, index: number) {
  const call = client.query.mock.calls[index];

  if (!call) {
    throw new Error(`Expected SQL call at index ${index}.`);
  }

  return call[0];
}

function getAllExecutedSql(client: MockClient) {
  return client.query.mock.calls.map(([sql]) => sql).join('\n');
}

describe('PaymentSettlementRepository', () => {
  let clientMock: MockClient;

  let databaseServiceMock: {
    withTransaction: jest.MockedFunction<MockWithTransaction>;
  };

  let repository: PaymentSettlementRepository;

  beforeEach(() => {
    const queryMock: jest.MockedFunction<MockQuery> = jest.fn();

    clientMock = {
      query: queryMock,
    };

    const withTransactionMock: jest.MockedFunction<MockWithTransaction> =
      jest.fn((callback) => callback(clientMock));

    databaseServiceMock = {
      withTransaction: withTransactionMock,
    };

    repository = new PaymentSettlementRepository(databaseServiceMock as never);
  });

  it('finalizes sale when pending payment becomes paid', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);

    clientMock.query
      .mockResolvedValueOnce({
        rows: [
          {
            orderPaymentStatus: 'PENDING',

            paymentStatus: 'PENDING',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'reservation-1',

            status: 'ACTIVE',

            variantId: 'variant-1',

            quantity: 2,

            expiresAt: futureDate,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'variant-1',

            stock: 10,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const result = await repository.applyGatewayStatus(
      'order-1',
      'payment-1',
      createGatewayStatus('PAID'),
    );

    expect(result).toMatchObject({
      action: 'FINALIZE_SALE',

      targetStatus: 'PAID',
    });

    expect(databaseServiceMock.withTransaction).toHaveBeenCalledTimes(1);

    expect(clientMock.query).toHaveBeenCalledTimes(8);

    expect(getExecutedSql(clientMock, 3)).toContain('UPDATE product_variants');

    expect(getExecutedSql(clientMock, 4)).toContain(
      'UPDATE stock_reservations',
    );

    expect(getExecutedSql(clientMock, 5)).toContain('SALE_CONFIRMED');

    expect(getExecutedSql(clientMock, 6)).toContain('UPDATE payments');

    expect(getExecutedSql(clientMock, 7)).toContain('UPDATE orders');
  });

  it('does not reduce stock twice when paid status is received again', async () => {
    clientMock.query
      .mockResolvedValueOnce({
        rows: [
          {
            orderPaymentStatus: 'PAID',

            paymentStatus: 'PAID',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const result = await repository.applyGatewayStatus(
      'order-1',
      'payment-1',
      createGatewayStatus('PAID'),
    );

    expect(result).toMatchObject({
      action: 'NOOP',

      targetStatus: 'PAID',
    });

    const executedSql = getAllExecutedSql(clientMock);

    expect(executedSql).not.toContain('UPDATE product_variants');

    expect(executedSql).not.toContain('SALE_CONFIRMED');

    expect(clientMock.query).toHaveBeenCalledTimes(2);
  });

  it('releases active reservation when pending payment fails', async () => {
    clientMock.query
      .mockResolvedValueOnce({
        rows: [
          {
            orderPaymentStatus: 'PENDING',

            paymentStatus: 'PENDING',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'reservation-1',

            variantId: 'variant-1',

            quantity: 2,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const result = await repository.applyGatewayStatus(
      'order-1',
      'payment-1',
      createGatewayStatus('FAILED'),
    );

    expect(result).toMatchObject({
      action: 'RELEASE_RESERVATION',

      targetStatus: 'FAILED',
    });

    expect(clientMock.query).toHaveBeenCalledTimes(5);

    expect(getExecutedSql(clientMock, 1)).toContain(
      'UPDATE stock_reservations',
    );

    expect(getExecutedSql(clientMock, 2)).toContain('RESERVATION_RELEASED');

    expect(getExecutedSql(clientMock, 3)).toContain('UPDATE payments');

    expect(getExecutedSql(clientMock, 4)).toContain('UPDATE orders');

    expect(getExecutedSql(clientMock, 1)).toContain("'RELEASED'");
  });

  it('requires review when payment succeeds after reservation is no longer active', async () => {
    const expiredDate = new Date(Date.now() - 60_000);

    clientMock.query
      .mockResolvedValueOnce({
        rows: [
          {
            orderPaymentStatus: 'PENDING',

            paymentStatus: 'PENDING',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'reservation-1',

            status: 'EXPIRED',

            variantId: 'variant-1',

            quantity: 2,

            expiresAt: expiredDate,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const result = await repository.applyGatewayStatus(
      'order-1',
      'payment-1',
      createGatewayStatus('PAID'),
    );

    expect(result).toMatchObject({
      action: 'REQUIRES_REVIEW',

      targetStatus: 'REQUIRES_REVIEW',
    });

    const executedSql = getAllExecutedSql(clientMock);

    expect(executedSql).not.toContain('UPDATE product_variants');

    expect(executedSql).not.toContain('SALE_CONFIRMED');

    expect(getExecutedSql(clientMock, 2)).toContain('UPDATE payments');

    expect(getExecutedSql(clientMock, 3)).toContain('UPDATE orders');
  });
});
