import "server-only";

import { db } from "@/lib/db";
import { getPriceSnapshot, type DiscountForPricing } from "@/lib/pricing";
import type { CreateOrderRequest } from "@/lib/orders/schemas";

type CatalogRow = {
  variantId: string;
  productId: string;
  productName: string;
  productIsActive: boolean;
  normalPrice: number;
  sku: string;
  colorName: string;
  size: string;
  weightGram: number;
  stock: number;
  variantIsActive: boolean;
  packagingWeightGram: number | null;
};

type DiscountRow = DiscountForPricing & {
  productId: string;
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
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
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

export async function buildOrderSnapshot(
  items: CreateOrderRequest["items"],
): Promise<OrderSnapshot> {
  const variantIds = Array.from(new Set(items.map((item) => item.variantId)));
  const catalogResult = await db.query<CatalogRow>(
    `
      SELECT
        v.id::text AS "variantId",
        v."productId"::text AS "productId",
        p.name AS "productName",
        p."isActive" AS "productIsActive",
        p."normalPrice",
        v.sku,
        v."colorName",
        v.size,
        v."weightGram",
        v.stock,
        v."isActive" AS "variantIsActive",
        settings."defaultPackagingWeightGram" AS "packagingWeightGram"
      FROM product_variants v
      INNER JOIN products p ON p.id = v."productId"
      LEFT JOIN LATERAL (
        SELECT "defaultPackagingWeightGram"
        FROM store_settings
        ORDER BY "createdAt" ASC
        LIMIT 1
      ) settings ON true
      WHERE v.id::text = ANY($1::text[])
    `,
    [variantIds],
  );
  const rowsByVariant = new Map(
    catalogResult.rows.map((row) => [row.variantId, row]),
  );
  const productIds = Array.from(
    new Set(catalogResult.rows.map((row) => row.productId)),
  );
  const discountsByProduct = await getDiscountsByProduct(productIds);
  const snapshotItems: OrderSnapshotItem[] = [];
  let packagingWeightGram = 0;

  for (const item of items) {
    const row = rowsByVariant.get(item.variantId);

    if (!row) {
      throw new OrderSnapshotError("VARIANT_NOT_FOUND", "Varian tidak ditemukan.");
    }

    if (item.productId !== row.productId) {
      throw new OrderSnapshotError(
        "VARIANT_PRODUCT_MISMATCH",
        "Data produk dan varian tidak cocok. Perbarui keranjang.",
      );
    }

    if (!row.productIsActive || !row.variantIsActive) {
      throw new OrderSnapshotError(
        "ITEM_INACTIVE",
        "Salah satu produk atau varian sudah tidak aktif.",
      );
    }

    if (row.stock <= 0 || row.stock < item.quantity) {
      throw new OrderSnapshotError(
        "STOCK_CHANGED",
        "Stok berubah. Periksa ulang keranjang sebelum membuat pesanan.",
      );
    }

    if (row.weightGram <= 0) {
      throw new OrderSnapshotError(
        "INVALID_WEIGHT",
        "Berat salah satu varian belum valid.",
      );
    }

    const activeDiscount = getActiveDiscount(
      discountsByProduct.get(row.productId) ?? [],
    );
    const price = getPriceSnapshot(
      row.normalPrice,
      activeDiscount ? [activeDiscount] : [],
    );
    const lineGross = row.normalPrice * item.quantity;
    const lineDiscount = price.saving * item.quantity;
    const lineNet = price.salePrice * item.quantity;

    snapshotItems.push({
      productId: row.productId,
      variantId: row.variantId,
      productName: row.productName,
      sku: row.sku,
      colorName: row.colorName,
      size: row.size,
      quantity: item.quantity,
      normalPrice: row.normalPrice,
      discountType: activeDiscount?.type ?? null,
      discountValue: activeDiscount?.value ?? null,
      discountLabel: price.discountLabel,
      salePrice: price.salePrice,
      lineGross,
      lineDiscount,
      lineNet,
      weightGram: row.weightGram,
      lineWeightGram: row.weightGram * item.quantity,
    });
    packagingWeightGram = row.packagingWeightGram ?? packagingWeightGram;
  }

  const totals = snapshotItems.reduce<OrderTotals>(
    (current, item) => ({
      grossSubtotal: current.grossSubtotal + item.lineGross,
      discountTotal: current.discountTotal + item.lineDiscount,
      netSubtotal: current.netSubtotal + item.lineNet,
      totalProductWeightGram:
        current.totalProductWeightGram + item.lineWeightGram,
      packagingWeightGram: current.packagingWeightGram,
      totalWeightGram: current.totalWeightGram + item.lineWeightGram,
    }),
    {
      grossSubtotal: 0,
      discountTotal: 0,
      netSubtotal: 0,
      totalProductWeightGram: 0,
      packagingWeightGram,
      totalWeightGram: packagingWeightGram,
    },
  );

  return {
    items: snapshotItems,
    totals,
  };
}

function getActiveDiscount(discounts: DiscountForPricing[]) {
  const now = new Date();
  return discounts.find(
    (discount) =>
      discount.isActive && discount.startsAt <= now && discount.endsAt >= now,
  );
}

async function getDiscountsByProduct(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, DiscountRow[]>();
  }

  const result = await db.query<DiscountRow>(
    `
      SELECT
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
  );
  const rowsByProduct = new Map<string, DiscountRow[]>();

  for (const row of result.rows) {
    const rows = rowsByProduct.get(row.productId) ?? [];
    rows.push(row);
    rowsByProduct.set(row.productId, rows);
  }

  return rowsByProduct;
}

export class OrderSnapshotError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OrderSnapshotError";
    this.code = code;
  }
}
