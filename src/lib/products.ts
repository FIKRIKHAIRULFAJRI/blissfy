import "server-only";

import { db } from "@/lib/db";

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

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  normalPrice: number;
};

type ImageRow = {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
};

type VariantRow = {
  id: string;
  productId: string;
  sku: string;
  colorName: string;
  colorHex: string | null;
  size: string;
  weightGram: number;
  stock: number;
  isActive: boolean;
};

type DiscountRow = {
  id: string;
  productId: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

export async function getCatalogProducts({
  limit,
}: {
  limit?: number;
} = {}): Promise<CatalogProduct[]> {
  const productsResult = await db.query<ProductRow>(
    `
      SELECT
        p.id::text,
        p.slug,
        p.name,
        p.description,
        c.name AS "categoryName",
        p."normalPrice"
      FROM products p
      INNER JOIN categories c ON c.id = p."categoryId"
      WHERE p."isActive" = true
      ORDER BY p."createdAt" DESC
      ${limit ? "LIMIT $1" : ""}
    `,
    limit ? [limit] : [],
  );

  return mapCatalogProducts(productsResult.rows);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const productResult = await db.query<ProductRow>(
    `
      SELECT
        p.id::text,
        p.slug,
        p.name,
        p.description,
        c.name AS "categoryName",
        p."normalPrice"
      FROM products p
      INNER JOIN categories c ON c.id = p."categoryId"
      WHERE p.slug = $1
        AND p."isActive" = true
      LIMIT 1
    `,
    [slug],
  );
  const product = productResult.rows[0];

  if (!product) {
    return null;
  }

  const relations = await getProductRelations([product.id]);
  return mapProductDetail(product, relations);
}

async function mapCatalogProducts(products: ProductRow[]) {
  if (products.length === 0) {
    return [];
  }

  const relations = await getProductRelations(products.map((product) => product.id));
  return products.map((product) => mapCatalogProduct(product, relations));
}

async function getProductRelations(productIds: string[]) {
  const [imagesResult, variantsResult, discountsResult] = await Promise.all([
    db.query<ImageRow>(
      `
        SELECT
          id::text,
          "productId"::text AS "productId",
          url,
          "altText"
        FROM product_images
        WHERE "productId"::text = ANY($1::text[])
        ORDER BY "isPrimary" DESC, "sortOrder" ASC
      `,
      [productIds],
    ),
    db.query<VariantRow>(
      `
        SELECT
          id::text,
          "productId"::text AS "productId",
          sku,
          "colorName",
          "colorHex",
          size,
          "weightGram",
          stock,
          "isActive"
        FROM product_variants
        WHERE "productId"::text = ANY($1::text[])
          AND "isActive" = true
        ORDER BY "colorName" ASC, size ASC
      `,
      [productIds],
    ),
    db.query<DiscountRow>(
      `
        SELECT
          id::text,
          "productId"::text AS "productId",
          type::text AS type,
          value,
          "startsAt",
          "endsAt",
          "isActive"
        FROM discounts
        WHERE "productId"::text = ANY($1::text[])
          AND "isActive" = true
        ORDER BY "startsAt" DESC
      `,
      [productIds],
    ),
  ]);

  return {
    imagesByProduct: groupByProductId(imagesResult.rows),
    variantsByProduct: groupByProductId(variantsResult.rows),
    discountsByProduct: groupByProductId(discountsResult.rows),
  };
}

function groupByProductId<T extends { productId: string }>(rows: T[]) {
  const map = new Map<string, T[]>();

  for (const row of rows) {
    const current = map.get(row.productId) ?? [];
    current.push(row);
    map.set(row.productId, current);
  }

  return map;
}

function mapProductDetail(
  product: ProductRow,
  relations: Awaited<ReturnType<typeof getProductRelations>>,
): ProductDetail {
  const images = relations.imagesByProduct.get(product.id) ?? [];
  const variants = relations.variantsByProduct.get(product.id) ?? [];

  return {
    ...mapCatalogProduct(product, relations),
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText ?? product.name,
    })),
    variants: variants.map((variant) => ({
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

function mapCatalogProduct(
  product: ProductRow,
  relations: Awaited<ReturnType<typeof getProductRelations>>,
): CatalogProduct {
  const images = relations.imagesByProduct.get(product.id) ?? [];
  const variants = relations.variantsByProduct.get(product.id) ?? [];
  const discounts = relations.discountsByProduct.get(product.id) ?? [];
  const activeDiscount = getActiveDiscount(discounts, new Date());
  const salePrice = activeDiscount
    ? applyDiscount(product.normalPrice, activeDiscount)
    : product.normalPrice;
  const image = images[0];
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    categoryName: product.categoryName,
    normalPrice: product.normalPrice,
    salePrice,
    discountLabel: activeDiscount ? getDiscountLabel(activeDiscount) : null,
    primaryImage: {
      url: image?.url ?? "/products/placeholder-ivory.svg",
      altText: image?.altText ?? product.name,
    },
    colors: uniqueColors(variants),
    totalStock,
    isAvailable: totalStock > 0,
  };
}

function getActiveDiscount(discounts: DiscountRow[], now: Date) {
  return discounts.find(
    (discount) =>
      discount.isActive && discount.startsAt <= now && discount.endsAt >= now,
  );
}

function applyDiscount(normalPrice: number, discount: DiscountRow) {
  if (discount.type === "PERCENTAGE") {
    return Math.max(
      1,
      normalPrice - Math.floor((normalPrice * discount.value) / 100),
    );
  }

  return Math.max(1, normalPrice - discount.value);
}

function getDiscountLabel(discount: DiscountRow) {
  if (discount.type === "PERCENTAGE") {
    return `-${discount.value}%`;
  }

  return `Hemat ${formatCompactRupiah(discount.value)}`;
}

function uniqueColors(variants: VariantRow[]) {
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
