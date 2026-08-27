import type { PaymentStatus } from './payment-gateway';

export const paymentTransitionActions = [
  'NOOP',
  'FINALIZE_SALE',
  'RELEASE_RESERVATION',
  'REQUIRES_REVIEW',
] as const;

export type PaymentTransitionAction = (typeof paymentTransitionActions)[number];

export type PaymentTransitionDecision = {
  action: PaymentTransitionAction;

  targetStatus: PaymentStatus;

  reason: string;
};

export function decidePaymentTransition(
  currentStatus: PaymentStatus,
  incomingStatus: PaymentStatus,
): PaymentTransitionDecision {
  if (currentStatus === incomingStatus) {
    return {
      action: 'NOOP',

      targetStatus: currentStatus,

      reason: 'Payment status is already up to date.',
    };
  }

  if (currentStatus === 'PAID') {
    if (incomingStatus === 'REFUNDED') {
      return {
        action: 'REQUIRES_REVIEW',

        targetStatus: 'REFUNDED',

        reason: 'Refund after a completed payment requires fulfillment review.',
      };
    }

    return {
      action: 'NOOP',

      targetStatus: 'PAID',

      reason:
        'A completed payment must not be downgraded by a later gateway status.',
    };
  }

  if (currentStatus === 'REQUIRES_REVIEW' || currentStatus === 'REFUNDED') {
    return {
      action: 'NOOP',

      targetStatus: currentStatus,

      reason: 'Payment already requires manual handling.',
    };
  }

  if (
    currentStatus === 'EXPIRED' ||
    currentStatus === 'FAILED' ||
    currentStatus === 'CANCELLED'
  ) {
    if (incomingStatus === 'PAID') {
      return {
        action: 'REQUIRES_REVIEW',

        targetStatus: 'REQUIRES_REVIEW',

        reason: 'Payment succeeded after the reservation was no longer active.',
      };
    }

    return {
      action: 'NOOP',

      targetStatus: currentStatus,

      reason: 'Terminal payment state must not be overwritten automatically.',
    };
  }

  if (currentStatus !== 'PENDING') {
    return {
      action: 'REQUIRES_REVIEW',

      targetStatus: 'REQUIRES_REVIEW',

      reason: 'Unexpected payment state transition.',
    };
  }

  switch (incomingStatus) {
    case 'PAID':
      return {
        action: 'FINALIZE_SALE',

        targetStatus: 'PAID',

        reason: 'Pending payment has been successfully paid.',
      };

    case 'EXPIRED':
    case 'FAILED':
    case 'CANCELLED':
      return {
        action: 'RELEASE_RESERVATION',

        targetStatus: incomingStatus,

        reason:
          'Payment did not complete and its stock reservation can be released.',
      };

    case 'REFUNDED':
    case 'REQUIRES_REVIEW':
      return {
        action: 'REQUIRES_REVIEW',

        targetStatus: incomingStatus,

        reason: 'Gateway status requires manual review.',
      };

    case 'PENDING':
      return {
        action: 'NOOP',

        targetStatus: 'PENDING',

        reason: 'Payment is still pending.',
      };
  }
}
