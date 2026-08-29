import "server-only";

import { getApiUrl } from "@/lib/api";
import type { ProductImage } from "@/lib/product-images";

export type { ProductImage } from "@/lib/product-images";

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

export async function getCatalogProducts({
  limit,
}: {
  limit?: number;
} = {}): Promise<CatalogProduct[]> {
  const searchParams = new URLSearchParams();

  if (limit !== undefined) {
    searchParams.set("limit", String(limit));
  }

  const query = searchParams.toString();

  const url = getApiUrl(
    `/v1/products${query ? `?${query}` : ""}`,
  );

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch catalog products: ${response.status}`,
    );
  }

  return (await response.json()) as CatalogProduct[];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const url = getApiUrl(
    `/v1/products/${encodeURIComponent(slug)}`,
  );

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch product "${slug}": ${response.status}`,
    );
  }

  return (await response.json()) as ProductDetail;
}
