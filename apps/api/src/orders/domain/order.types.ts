export type CreateOrderResult = {
  orderNumber: string;
  accessToken: string;
  expiresAt: string;
  reused: boolean;
};

export type OrderSnapshotItem = {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  colorName: string;
  size: string;
  quantity: number;

  normalPrice: number;

  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;

  discountValue: number | null;
  discountLabel: string | null;

  salePrice: number;

  lineGross: number;
  lineDiscount: number;
  lineNet: number;

  weightGram: number;
  lineWeightGram: number;
};

export type OrderTotals = {
  grossSubtotal: number;
  discountTotal: number;
  netSubtotal: number;

  totalProductWeightGram: number;
  packagingWeightGram: number;
  totalWeightGram: number;
};

export type OrderSnapshot = {
  items: OrderSnapshotItem[];
  totals: OrderTotals;
};

export class OrderSnapshotError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OrderSnapshotError';
  }
}

export class CreateOrderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'CreateOrderError';
  }
}
