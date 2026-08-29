export type ProductImage = {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  normalPrice: number;
  salePrice: number;
  discountLabel: string | null;
  images: ProductImage[];
  primaryImage: ProductImage;
  colors: Array<{
    name: string;
    value: string | null;
  }>;
  totalStock: number;
  isAvailable: boolean;
};

export type ProductDetail = CatalogProduct & {
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
