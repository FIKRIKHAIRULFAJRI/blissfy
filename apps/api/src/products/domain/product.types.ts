export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  normalPrice: number;
  salePrice: number;
  discountLabel: string | null;
  primaryImage: {
    url: string;
    altText: string;
  };
  colors: Array<{
    name: string;
    value: string | null;
  }>;
  totalStock: number;
  isAvailable: boolean;
};

export type ProductDetail = CatalogProduct & {
  images: Array<{
    id: string;
    url: string;
    altText: string;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    colorName: string;
    colorHex: string | null;
    size: string;
    weightGram: number;
    stock: number;
    isActive: boolean;
  }>;
};
