export const paymentStatuses = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "REQUIRES_REVIEW",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export const terminalPaymentStatuses: PaymentStatus[] = [
  "PAID",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "REQUIRES_REVIEW",
];

export function isTerminalPaymentStatus(status: PaymentStatus) {
  return terminalPaymentStatuses.includes(status);
}
