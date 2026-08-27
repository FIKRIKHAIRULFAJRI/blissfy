import { decidePaymentTransition } from './payment-transition';

describe('decidePaymentTransition', () => {
  it('finalizes a pending payment when it becomes paid', () => {
    expect(decidePaymentTransition('PENDING', 'PAID')).toMatchObject({
      action: 'FINALIZE_SALE',

      targetStatus: 'PAID',
    });
  });

  it.each(['EXPIRED', 'FAILED', 'CANCELLED'] as const)(
    'releases reservation when pending becomes %s',
    (incomingStatus) => {
      expect(decidePaymentTransition('PENDING', incomingStatus)).toMatchObject({
        action: 'RELEASE_RESERVATION',

        targetStatus: incomingStatus,
      });
    },
  );

  it('does nothing when status has not changed', () => {
    expect(decidePaymentTransition('PENDING', 'PENDING')).toMatchObject({
      action: 'NOOP',

      targetStatus: 'PENDING',
    });
  });

  it('does not downgrade a paid payment', () => {
    expect(decidePaymentTransition('PAID', 'FAILED')).toMatchObject({
      action: 'NOOP',

      targetStatus: 'PAID',
    });
  });

  it('requires review when payment succeeds after expiry', () => {
    expect(decidePaymentTransition('EXPIRED', 'PAID')).toMatchObject({
      action: 'REQUIRES_REVIEW',

      targetStatus: 'REQUIRES_REVIEW',
    });
  });

  it('requires review for refund after paid', () => {
    expect(decidePaymentTransition('PAID', 'REFUNDED')).toMatchObject({
      action: 'REQUIRES_REVIEW',

      targetStatus: 'REFUNDED',
    });
  });

  it('keeps an existing review state', () => {
    expect(decidePaymentTransition('REQUIRES_REVIEW', 'PAID')).toMatchObject({
      action: 'NOOP',

      targetStatus: 'REQUIRES_REVIEW',
    });
  });
});
