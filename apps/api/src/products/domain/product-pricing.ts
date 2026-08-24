export type DiscountForPricing = {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

export type PriceSnapshot = {
  normalPrice: number;
  salePrice: number;
  discountLabel: string | null;
  saving: number;
};

export function getPriceSnapshot(
  normalPrice: number,
  discounts: DiscountForPricing[],
  now = new Date(),
): PriceSnapshot {
  const activeDiscount = getActiveDiscount(discounts, now);

  const salePrice = activeDiscount
    ? applyDiscount(normalPrice, activeDiscount)
    : normalPrice;

  return {
    normalPrice,
    salePrice,
    discountLabel: activeDiscount ? getDiscountLabel(activeDiscount) : null,
    saving: Math.max(0, normalPrice - salePrice),
  };
}

export function getActiveDiscount(discounts: DiscountForPricing[], now: Date) {
  return discounts.find(
    (discount) =>
      discount.isActive && discount.startsAt <= now && discount.endsAt >= now,
  );
}

export function applyDiscount(
  normalPrice: number,
  discount: DiscountForPricing,
) {
  if (discount.type === 'PERCENTAGE') {
    return Math.max(
      1,
      normalPrice - Math.floor((normalPrice * discount.value) / 100),
    );
  }

  return Math.max(1, normalPrice - discount.value);
}

export function getDiscountLabel(discount: DiscountForPricing) {
  if (discount.type === 'PERCENTAGE') {
    return `-${discount.value}%`;
  }

  return `Hemat ${formatRupiah(discount.value)}`;
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, '');
}
