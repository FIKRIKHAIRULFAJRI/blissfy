/**
 * Payments module contracts
 */

import type { PaymentStatus } from '../common';

export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  provider: string | null;
  gatewayTransactionId: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  provider: string;
  eventType: string;
  eventId: string | null;
  rawPayload: unknown;
  processedAt: string;
}

// Webhook payload (minimal, provider-agnostic)
export interface PaymentWebhookPayload {
  orderId: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface RetryPaymentRequest {
  orderId: string;
}

export interface RetryPaymentResponse {
  payment: {
    status: PaymentStatus;
    amount: number;
    qrUrl: string | null;
    expiresAt: string;
  };
}
