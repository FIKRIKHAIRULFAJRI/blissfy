import "server-only";

import { z } from "zod";
import { cartValidationItemSchema } from "@/lib/cart/schemas";
import { db } from "@/lib/db";
import { getShippingConfig } from "@/lib/shipping/config";
import { ShippingProviderError } from "@/lib/shipping/types";

type WeightRow = {
  variantId: string;
  productId: string;
  productIsActive: boolean;
  variantIsActive: boolean;
  stock: number;
  weightGram: number;
  packagingWeightGram: number | null;
};

export type ShippingCartValidation = {
  items: z.infer<typeof cartValidationItemSchema>[];
  totalProductWeightGrams: number;
  packagingWeightGrams: number;
  totalWeightGrams: number;
  originDistrictId: string;
};

export async function validateShippingCart(
  inputItems: Array<z.infer<typeof cartValidationItemSchema>>,
): Promise<ShippingCartValidation> {
  if (inputItems.length === 0) {
    throw new ShippingProviderError({
      code: "SHIPPING_BAD_REQUEST",
      message: "Keranjang masih kosong.",
      status: 400,
    });
  }

  const variantIds = Array.from(
    new Set(inputItems.map((item) => item.variantId)),
  );
  const rowsResult = await db.query<WeightRow>(
    `
      SELECT
        v.id::text AS "variantId",
        v."productId"::text AS "productId",
        p."isActive" AS "productIsActive",
        v."isActive" AS "variantIsActive",
        v.stock,
        v."weightGram",
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
    rowsResult.rows.map((row) => [row.variantId, row]),
  );
  const originDistrictId = getShippingConfig().originDistrictId;
  let totalProductWeightGrams = 0;
  let packagingWeightGrams = 0;

  for (const item of inputItems) {
    const row = rowsByVariant.get(item.variantId);

    if (!row) {
      throw new ShippingProviderError({
        code: "SHIPPING_BAD_REQUEST",
        message: "Salah satu varian di keranjang tidak ditemukan.",
        status: 400,
      });
    }

    if (item.productId !== row.productId) {
      throw new ShippingProviderError({
        code: "SHIPPING_BAD_REQUEST",
        message: "Data produk dan varian di keranjang tidak cocok.",
        status: 400,
      });
    }

    if (!row.productIsActive || !row.variantIsActive) {
      throw new ShippingProviderError({
        code: "SHIPPING_BAD_REQUEST",
        message: "Salah satu produk atau varian di keranjang sudah tidak aktif.",
        status: 400,
      });
    }

    if (row.stock < item.quantity) {
      throw new ShippingProviderError({
        code: "SHIPPING_BAD_REQUEST",
        message: "Stok salah satu varian tidak mencukupi.",
        status: 400,
      });
    }

    if (row.weightGram <= 0) {
      throw new ShippingProviderError({
        code: "SHIPPING_BAD_REQUEST",
        message: "Berat salah satu varian belum valid.",
        status: 400,
      });
    }

    totalProductWeightGrams += row.weightGram * item.quantity;
    packagingWeightGrams = row.packagingWeightGram ?? packagingWeightGrams;
  }

  const totalWeightGrams = totalProductWeightGrams + packagingWeightGrams;

  if (totalWeightGrams <= 0) {
    throw new ShippingProviderError({
      code: "SHIPPING_BAD_REQUEST",
      message: "Berat kiriman belum valid.",
      status: 400,
    });
  }

  if (!originDistrictId) {
    throw new ShippingProviderError({
      code: "SHIPPING_NOT_CONFIGURED",
      message:
        "ID kecamatan asal pengiriman belum dikonfigurasi untuk provider ongkir.",
      status: 503,
    });
  }

  return {
    items: inputItems,
    totalProductWeightGrams,
    packagingWeightGrams,
    totalWeightGrams,
    originDistrictId,
  };
}
