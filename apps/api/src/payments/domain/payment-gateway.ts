export const paymentStatuses = [
  'PENDING',
  'PAID',
  'EXPIRED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
  'REQUIRES_REVIEW',
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export type CreateQrisPaymentInput = {
  orderNumber: string;

  amount: number;

  expiresAt: Date;

  customer: {
    name: string;

    email: string;

    phone: string;
  };
};

export type QrisPaymentResult = {
  provider: string;

  /**
   * Identifier milik merchant / partner.
   *
   * Untuk DOKU:
   * partnerReferenceNo.
   */
  providerOrderId: string;

  /**
   * Identifier transaksi yang diberikan payment gateway.
   *
   * Untuk DOKU:
   * referenceNo.
   */
  providerTransactionId: string | null;

  status: PaymentStatus;

  amount: number;

  qrImageUrl: string | null;

  qrString: string | null;

  expiresAt: string;

  rawResponse?: Record<string, unknown>;
};

export type GetPaymentStatusInput = {
  /**
   * Identifier merchant / partner.
   */
  providerOrderId: string;

  /**
   * Identifier transaksi dari gateway.
   */
  providerTransactionId: string | null;
};

export type PaymentStatusResult = {
  provider: string;

  providerOrderId: string;

  providerTransactionId: string | null;

  status: PaymentStatus;

  paidAt: string | null;

  rawResponse?: Record<string, unknown>;
};

export interface PaymentGateway {
  createQrisPayment(input: CreateQrisPaymentInput): Promise<QrisPaymentResult>;

  getPaymentStatus(input: GetPaymentStatusInput): Promise<PaymentStatusResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
