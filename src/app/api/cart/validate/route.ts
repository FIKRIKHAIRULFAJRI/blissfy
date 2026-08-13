import { NextResponse } from "next/server";
import { z } from "zod";
import {
  cartValidationItemSchema,
  cartValidationSchema,
} from "@/lib/cart/schemas";
import type {
  CartValidationNotice,
  CartValidationResponse,
  InvalidCartItem,
  ValidatedCartItem,
} from "@/lib/cart/types";
import { db } from "@/lib/db";
import { getPriceSnapshot, type DiscountForPricing } from "@/lib/pricing";

type VariantLookupRow = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  normalPrice: number;
  productIsActive: boolean;
  sku: string;
  colorName: string;
  colorHex: string | null;
  size: string;
  weightGram: number;
  stock: number;
  variantIsActive: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

type DiscountRow = DiscountForPricing & {
  productId: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = cartValidationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Payload keranjang tidak valid.",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  if (parsed.data.items.length === 0) {
    return NextResponse.json<CartValidationResponse>({
      ok: true,
      items: [],
      invalidItems: [],
      notices: [],
      summary: {
        grossSubtotal: 0,
        discountTotal: 0,
        netSubtotal: 0,
        totalItems: 0,
        totalWeightGram: 0,
        allValid: false,
      },
    });
  }

  const invalidItems: InvalidCartItem[] = [];
  const validRequestedItems: z.infer<typeof cartValidationItemSchema>[] = [];

  for (const [index, item] of parsed.data.items.entries()) {
    const parsedItem = cartValidationItemSchema.safeParse(item);

    if (parsedItem.success) {
      validRequestedItems.push(parsedItem.data);
      continue;
    }

    const rawItem =
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : undefined;
    const variantId =
      typeof rawItem?.variantId === "string" && rawItem.variantId.trim()
        ? rawItem.variantId
        : `stale-item-${index}`;
    const productId =
      typeof rawItem?.productId === "string" ? rawItem.productId : undefined;
    const name = typeof rawItem?.name === "string" ? rawItem.name : undefined;
    const invalidItem: InvalidCartItem = {
      variantId,
      reason:
        "Item keranjang tersimpan memakai format lama. Hapus item ini lalu tambahkan ulang dari halaman produk.",
      stock: 0,
    };

    if (productId) {
      invalidItem.productId = productId;
    }

    if (name) {
      invalidItem.name = name;
    }

    invalidItems.push(invalidItem);
  }

  if (validRequestedItems.length === 0) {
    return NextResponse.json<CartValidationResponse>({
      ok: true,
      items: [],
      invalidItems,
      notices: [],
      summary: {
        grossSubtotal: 0,
        discountTotal: 0,
        netSubtotal: 0,
        totalItems: 0,
        totalWeightGram: 0,
        allValid: false,
      },
    });
  }

  const variantIds = Array.from(
    new Set(validRequestedItems.map((item) => item.variantId)),
  );

  let variantRows: VariantLookupRow[] = [];
  let discountsByProduct = new Map<string, DiscountRow[]>();

  try {
    const variantsResult = await db.query<VariantLookupRow>(
      `
        SELECT
          v.id::text AS "variantId",
          v."productId"::text AS "productId",
          p.slug,
          p.name,
          p."normalPrice",
          p."isActive" AS "productIsActive",
          v.sku,
          v."colorName",
          v."colorHex",
          v.size,
          v."weightGram",
          v.stock,
          v."isActive" AS "variantIsActive",
          img.url AS "imageUrl",
          img."altText" AS "imageAlt"
        FROM product_variants v
        INNER JOIN products p ON p.id = v."productId"
        LEFT JOIN LATERAL (
          SELECT url, "altText"
          FROM product_images
          WHERE "productId" = p.id
          ORDER BY "isPrimary" DESC, "sortOrder" ASC
          LIMIT 1
        ) img ON true
        WHERE v.id::text = ANY($1::text[])
      `,
      [variantIds],
    );
    variantRows = variantsResult.rows;

    const productIds = Array.from(
      new Set(variantRows.map((row) => row.productId)),
    );
    discountsByProduct = await getDiscountsByProduct(productIds);
  } catch (error) {
    console.error("Cart validation database query failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        ok: false,
        message:
          "Keranjang belum dapat divalidasi karena database belum tersedia. Coba lagi.",
      },
      { status: 503 },
    );
  }

  const rowsByVariant = new Map(
    variantRows.map((row) => [row.variantId, row]),
  );

  const validItems: ValidatedCartItem[] = [];
  const notices: CartValidationNotice[] = [];

  for (const item of validRequestedItems) {
    const row = rowsByVariant.get(item.variantId);

    if (!row) {
      invalidItems.push({
        variantId: item.variantId,
        reason: "Varian tidak ditemukan atau sudah dihapus.",
        stock: 0,
      });
      continue;
    }

    if (item.productId !== row.productId) {
      invalidItems.push({
        variantId: item.variantId,
        productId: item.productId,
        name: row.name,
        reason:
          "Data produk dan varian di keranjang tidak cocok. Hapus item ini lalu tambahkan ulang.",
        stock: row.stock,
      });
      continue;
    }

    if (!row.productIsActive || !row.variantIsActive || row.stock <= 0) {
      invalidItems.push({
        variantId: item.variantId,
        productId: row.productId,
        name: row.name,
        reason: !row.productIsActive
          ? "Produk tidak aktif."
          : !row.variantIsActive
            ? "Varian tidak aktif."
            : "Stok varian habis.",
        stock: row.stock,
      });
      continue;
    }

    const discounts = discountsByProduct.get(row.productId) ?? [];
    const price = getPriceSnapshot(row.normalPrice, discounts);
    const quantity = Math.min(item.quantity, row.stock);

    if (item.normalPrice !== undefined && item.normalPrice !== row.normalPrice) {
      notices.push({
        variantId: item.variantId,
        type: "price_changed",
        message: `Harga normal ${row.name} diperbarui dari database.`,
      });
    }

    if (item.salePrice !== undefined && item.salePrice !== price.salePrice) {
      notices.push({
        variantId: item.variantId,
        type: "price_changed",
        message: `Harga akhir ${row.name} diperbarui dari database.`,
      });
    }

    if (item.stock !== undefined && item.stock !== row.stock) {
      notices.push({
        variantId: item.variantId,
        type: "stock_changed",
        message: `Stok ${row.name} varian ${row.colorName}/${row.size} berubah menjadi ${row.stock}.`,
      });
    }

    if (quantity !== item.quantity) {
      notices.push({
        variantId: item.variantId,
        type: "quantity_adjusted",
        message: `Jumlah ${row.name} disesuaikan ke stok tersedia.`,
      });
    }

    validItems.push({
      productId: row.productId,
      variantId: row.variantId,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl ?? "/products/placeholder-ivory.svg",
      imageAlt: row.imageAlt ?? row.name,
      colorName: row.colorName,
      colorHex: row.colorHex,
      size: row.size,
      quantity,
      normalPrice: row.normalPrice,
      salePrice: price.salePrice,
      discountLabel: price.discountLabel,
      weightGram: row.weightGram,
      stock: row.stock,
      sku: row.sku,
      lineGross: row.normalPrice * quantity,
      lineDiscount: price.saving * quantity,
      lineNet: price.salePrice * quantity,
      lineWeightGram: row.weightGram * quantity,
    });
  }

  const summary = validItems.reduce(
    (totals, item) => {
      totals.grossSubtotal += item.lineGross;
      totals.discountTotal += item.lineDiscount;
      totals.netSubtotal += item.lineNet;
      totals.totalItems += item.quantity;
      totals.totalWeightGram += item.lineWeightGram;
      return totals;
    },
    {
      grossSubtotal: 0,
      discountTotal: 0,
      netSubtotal: 0,
      totalItems: 0,
      totalWeightGram: 0,
      allValid: false,
    },
  );

  summary.allValid = validItems.length > 0 && invalidItems.length === 0;

  return NextResponse.json<CartValidationResponse>({
    ok: true,
    items: validItems,
    invalidItems,
    notices,
    summary,
  });
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

  const discountsByProduct = new Map<string, DiscountRow[]>();

  for (const row of result.rows) {
    const discounts = discountsByProduct.get(row.productId) ?? [];
    discounts.push(row);
    discountsByProduct.set(row.productId, discounts);
  }

  return discountsByProduct;
}
