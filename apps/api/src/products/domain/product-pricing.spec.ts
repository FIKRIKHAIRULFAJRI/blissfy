import {
  applyDiscount,
  getActiveDiscount,
  getDiscountLabel,
  getPriceSnapshot,
  type DiscountForPricing,
} from './product-pricing';

describe('Product Pricing', () => {
  const now = new Date('2026-08-24T12:00:00.000Z');

  const percentageDiscount: DiscountForPricing = {
    type: 'PERCENTAGE',
    value: 10,
    startsAt: new Date('2026-08-20T00:00:00.000Z'),
    endsAt: new Date('2026-08-30T23:59:59.000Z'),
    isActive: true,
  };

  const fixedDiscount: DiscountForPricing = {
    type: 'FIXED_AMOUNT',
    value: 20000,
    startsAt: new Date('2026-08-20T00:00:00.000Z'),
    endsAt: new Date('2026-08-30T23:59:59.000Z'),
    isActive: true,
  };

  it('should find an active discount', () => {
    expect(getActiveDiscount([percentageDiscount], now)).toEqual(
      percentageDiscount,
    );
  });

  it('should ignore an inactive discount', () => {
    expect(
      getActiveDiscount(
        [
          {
            ...percentageDiscount,
            isActive: false,
          },
        ],
        now,
      ),
    ).toBeUndefined();
  });

  it('should apply percentage discount', () => {
    expect(applyDiscount(200000, percentageDiscount)).toBe(180000);
  });

  it('should apply fixed amount discount', () => {
    expect(applyDiscount(200000, fixedDiscount)).toBe(180000);
  });

  it('should create percentage discount label', () => {
    expect(getDiscountLabel(percentageDiscount)).toBe('-10%');
  });

  it('should calculate price snapshot', () => {
    expect(getPriceSnapshot(200000, [percentageDiscount], now)).toEqual({
      normalPrice: 200000,
      salePrice: 180000,
      discountLabel: '-10%',
      saving: 20000,
    });
  });

  it('should keep normal price when there is no active discount', () => {
    expect(getPriceSnapshot(200000, [], now)).toEqual({
      normalPrice: 200000,
      salePrice: 200000,
      discountLabel: null,
      saving: 0,
    });
  });
});
