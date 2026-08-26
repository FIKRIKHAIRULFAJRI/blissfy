export type ValidatedCartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  colorName: string;
  colorHex: string | null;
  size: string;
  quantity: number;
  normalPrice: number;
  salePrice: number;
  discountLabel: string | null;
  weightGram: number;
  stock: number;
  sku: string;
  lineGross: number;
  lineDiscount: number;
  lineNet: number;
  lineWeightGram: number;
};

export type InvalidCartItem = {
  variantId: string;
  productId?: string;
  name?: string;
  reason: string;
  stock: number;
};

export type CartValidationNotice = {
  variantId: string;
  type: 'price_changed' | 'stock_changed' | 'quantity_adjusted';
  message: string;
};

export type CartValidationSummary = {
  grossSubtotal: number;
  discountTotal: number;
  netSubtotal: number;
  totalItems: number;
  totalWeightGram: number;
  allValid: boolean;
};

export type CartValidationResponse = {
  ok: true;
  items: ValidatedCartItem[];
  invalidItems: InvalidCartItem[];
  notices: CartValidationNotice[];
  summary: CartValidationSummary;
};
