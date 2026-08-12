import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

const productInclude = {
  category: true,
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
  },
  variants: {
    where: { isActive: true },
    orderBy: [{ colorName: "asc" as const }, { size: "asc" as const }],
  },
  discounts: {
    where: { isActive: true },
    orderBy: { startsAt: "desc" as const },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export async function getCatalogProducts({
  limit,
}: {
  limit?: number;
} = {}): Promise<CatalogProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map(mapCatalogProduct);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productInclude,
  });

  if (!product) {
    return null;
  }

  return mapProductDetail(product);
}

function mapProductDetail(product: ProductWithRelations): ProductDetail {
  return {
    ...mapCatalogProduct(product),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText ?? product.name,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      weightGram: variant.weightGram,
      stock: variant.stock,
      isActive: variant.isActive,
    })),
  };
}

function mapCatalogProduct(product: ProductWithRelations): CatalogProduct {
  const activeDiscount = getActiveDiscount(product.discounts, new Date());
  const salePrice = activeDiscount
    ? applyDiscount(product.normalPrice, activeDiscount)
    : product.normalPrice;
  const image = product.images[0];
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    categoryName: product.category.name,
    normalPrice: product.normalPrice,
    salePrice,
    discountLabel: activeDiscount ? getDiscountLabel(activeDiscount) : null,
    primaryImage: {
      url: image?.url ?? "/products/placeholder-ivory.svg",
      altText: image?.altText ?? product.name,
    },
    colors: uniqueColors(product.variants),
    totalStock,
    isAvailable: totalStock > 0,
  };
}

function getActiveDiscount(
  discounts: ProductWithRelations["discounts"],
  now: Date,
) {
  return discounts.find(
    (discount) =>
      discount.isActive && discount.startsAt <= now && discount.endsAt >= now,
  );
}

function applyDiscount(
  normalPrice: number,
  discount: ProductWithRelations["discounts"][number],
) {
  if (discount.type === "PERCENTAGE") {
    return Math.max(
      1,
      normalPrice - Math.floor((normalPrice * discount.value) / 100),
    );
  }

  return Math.max(1, normalPrice - discount.value);
}

function getDiscountLabel(discount: ProductWithRelations["discounts"][number]) {
  if (discount.type === "PERCENTAGE") {
    return `-${discount.value}%`;
  }

  return `Hemat ${formatCompactRupiah(discount.value)}`;
}

function uniqueColors(variants: ProductWithRelations["variants"]) {
  const colors = new Map<string, string | null>();

  for (const variant of variants) {
    if (!colors.has(variant.colorName)) {
      colors.set(variant.colorName, variant.colorHex);
    }
  }

  return Array.from(colors, ([name, value]) => ({ name, value })).slice(0, 4);
}

function formatCompactRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "");
}
