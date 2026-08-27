import { z } from 'zod';

import type { PaymentStatus } from '../../domain/payment-gateway';

const dokuAmountSchema = z.object({
  value: z.union([z.string(), z.number()]),

  currency: z.string().trim().length(3),
});

export const dokuQrisNotificationSchema = z
  .object({
    originalReferenceNo: z.string().trim().min(1).max(64),

    originalPartnerReferenceNo: z.string().trim().min(1).max(64),

    latestTransactionStatus: z.string().trim().min(2).max(2),

    transactionStatusDesc: z.string().trim().max(150).optional(),

    amount: dokuAmountSchema,

    paidTime: z.string().trim().min(1).optional(),

    transactionDate: z.string().trim().min(1).optional(),

    additionalInfo: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type DokuQrisNotification = z.infer<typeof dokuQrisNotificationSchema>;

export function parseDokuQrisNotification(
  input: unknown,
): DokuQrisNotification {
  const result = dokuQrisNotificationSchema.safeParse(input);

  if (!result.success) {
    throw new DokuQrisNotificationError(
      'INVALID_DOKU_NOTIFICATION',

      'Payload notifikasi QRIS DOKU tidak valid.',
    );
  }

  return result.data;
}

export function mapDokuNotificationStatus(
  latestTransactionStatus: string,
): PaymentStatus {
  switch (latestTransactionStatus) {
    case '00':
      return 'PAID';

    case '01':
    case '02':
    case '03':
      return 'PENDING';

    case '04':
      return 'REFUNDED';

    case '05':
      return 'CANCELLED';

    case '06':
      return 'FAILED';

    case '07':
      return 'REQUIRES_REVIEW';

    default:
      return 'REQUIRES_REVIEW';
  }
}

export function parseDokuNotificationAmount(
  amount: DokuQrisNotification['amount'],
): number {
  const currency = amount.currency.trim().toUpperCase();

  if (currency !== 'IDR') {
    throw new DokuQrisNotificationError(
      'INVALID_DOKU_CURRENCY',

      'Currency notifikasi DOKU harus IDR.',
    );
  }

  const value =
    typeof amount.value === 'number'
      ? amount.value
      : Number(amount.value.trim());

  if (!Number.isFinite(value) || value <= 0 || !Number.isSafeInteger(value)) {
    throw new DokuQrisNotificationError(
      'INVALID_DOKU_AMOUNT',

      'Amount notifikasi DOKU tidak valid.',
    );
  }

  return value;
}

export function getDokuPaidAt(
  notification: DokuQrisNotification,
): string | null {
  if (
    mapDokuNotificationStatus(notification.latestTransactionStatus) !== 'PAID'
  ) {
    return null;
  }

  const candidate =
    notification.paidTime ?? notification.transactionDate ?? null;

  if (!candidate) {
    return null;
  }

  const parsed = new Date(candidate);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export class DokuQrisNotificationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);

    this.name = 'DokuQrisNotificationError';

    this.code = code;
  }
}
