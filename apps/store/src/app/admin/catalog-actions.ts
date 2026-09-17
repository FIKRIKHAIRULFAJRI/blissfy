"use server";

import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { requestAdminCategoryApi } from "@/lib/admin/category-api";
import { requestAdminProductApi } from "@/lib/admin/product-api";
import { db } from "@/lib/db";

const discountTypes = ["PERCENTAGE", "FIXED_AMOUNT"] as const;
type DiscountType = (typeof discountTypes)[number];

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug minimal 2 karakter.")
  .max(120, "Slug terlalu panjang.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
  );

const productSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih."),
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter."),
  slug: slugSchema,
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter."),
  normalPrice: z.coerce
    .number()
    .int("Harga harus berupa angka bulat.")
    .min(1, "Harga tidak boleh negatif atau nol."),
  isActive: z.boolean(),
});

const variantSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  sku: z
    .string()
    .trim()
    .min(3, "SKU minimal 3 karakter.")
    .max(80, "SKU terlalu panjang."),
  colorName: z.string().trim().min(2, "Nama warna wajib diisi."),
  colorHex: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || /^#[0-9A-Fa-f]{6}$/.test(value),
      "Warna hex harus seperti #AABBCC.",
    ),
  size: z.string().trim().min(1, "Ukuran wajib diisi.").max(20),
  weightGram: z.coerce
    .number()
    .int("Berat harus berupa angka bulat.")
    .min(1, "Berat harus lebih dari 0 gram."),
  stock: z.coerce
    .number()
    .int("Stok harus berupa angka bulat.")
    .min(0, "Stok tidak boleh negatif."),
  isActive: z.boolean(),
});

const discountSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  type: z.enum(discountTypes),
  value: z.coerce
    .number()
    .int("Nilai diskon harus berupa angka bulat.")
    .min(1, "Nilai diskon harus lebih dari 0."),
  startsAt: z.coerce.date({ message: "Waktu mulai diskon tidak valid." }),
  endsAt: z.coerce.date({ message: "Waktu akhir diskon tidak valid." }),
  isActive: z.boolean(),
});

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function redirectWith(
  path: string,
  params: {
    error?: string;
    notice?: string;
  },
): never {
  const search = new URLSearchParams();

  if (params.error) {
    search.set("error", params.error);
  }

  if (params.notice) {
    search.set("notice", params.notice);
  }

  redirect(`${path}?${search.toString()}`);
}

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Input tidak valid.";
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function ensureProductSlug(slug: string, currentId?: string) {
  const result = await db.query<{ id: string }>(
    `SELECT id::text FROM products WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  const existing = result.rows[0];
  return !existing || existing.id === currentId;
}

async function ensureSku(sku: string, currentId?: string) {
  const result = await db.query<{ id: string }>(
    `SELECT id::text FROM product_variants WHERE sku = $1 LIMIT 1`,
    [sku],
  );
  const existing = result.rows[0];
  return !existing || existing.id === currentId;
}

async function getProductNormalPrice(productId: string) {
  const result = await db.query<{ normalPrice: number }>(
    `SELECT "normalPrice" FROM products WHERE id::text = $1 LIMIT 1`,
    [productId],
  );

  return result.rows[0]?.normalPrice ?? null;
}

async function validateDiscountValue({
  path,
  productId,
  type,
  value,
}: {
  path: string;
  productId: string;
  type: DiscountType;
  value: number;
}) {
  const normalPrice = await getProductNormalPrice(productId);

  if (!normalPrice) {
    redirectWith(path, { error: "Produk tidak ditemukan." });
  }

  if (type === "PERCENTAGE" && value > 90) {
    redirectWith(path, {
      error: "Diskon persentase maksimal 90% agar harga tidak menjadi nol.",
    });
  }

  if (type === "FIXED_AMOUNT" && value >= normalPrice) {
    redirectWith(path, {
      error: "Diskon nominal harus lebih kecil dari harga normal produk.",
    });
  }
}

async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const payload = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    isActive: getBoolean(formData, "isActive"),
  };
  const response = await requestAdminCategoryApi({
    body: JSON.stringify(payload),
    method: "POST",
    path: "/v1/admin/categories",
  });

  if (!response.ok) {
    redirectWith("/admin/categories", { error: await apiErrorMessage(response) });
  }

  redirectWith("/admin/categories", { notice: "Kategori berhasil dibuat." });
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");

  if (!id) {
    redirectWith("/admin/categories", { error: "Data kategori tidak valid." });
  }

  const payload = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    isActive: getBoolean(formData, "isActive"),
  };
  const response = await requestAdminCategoryApi({
    body: JSON.stringify(payload),
    method: "PATCH",
    path: `/v1/admin/categories/${encodeURIComponent(id)}`,
  });

  if (!response.ok) {
    redirectWith("/admin/categories", { error: await apiErrorMessage(response) });
  }

  redirectWith("/admin/categories", { notice: "Kategori berhasil diperbarui." });
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const confirmed = getBoolean(formData, "confirmDelete");

  if (!id || !confirmed) {
    redirectWith("/admin/categories", {
      error: "Centang konfirmasi sebelum menghapus kategori.",
    });
  }

  const response = await requestAdminCategoryApi({
    method: "DELETE",
    path: `/v1/admin/categories/${encodeURIComponent(id)}`,
  });

  if (!response.ok) {
    redirectWith("/admin/categories", { error: await apiErrorMessage(response) });
  }
  redirectWith("/admin/categories", { notice: "Kategori berhasil dihapus." });
}

async function apiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message[0] ?? "Permintaan kategori tidak valid.";
    }
    if (payload.message) {
      return payload.message;
    }
  } catch {
    // Keep the stable fallback when an upstream response is not JSON.
  }

  return "Permintaan kategori gagal. Coba lagi.";
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    categoryId: getString(formData, "categoryId"),
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    normalPrice: getString(formData, "normalPrice"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    redirectWith("/admin/products/new", {
      error: validationMessage(parsed.error),
    });
  }

  const initialVariant = getInitialVariant(formData);
  const initialDiscount = getInitialDiscount(formData);
  const response = await requestAdminProductApi({ body: JSON.stringify({ ...parsed.data, initialVariant, initialDiscount }), method: "POST", path: "/v1/admin/products" });
  if (!response.ok) redirectWith("/admin/products/new", { error: await apiErrorMessage(response) });
  const { id: productId } = (await response.json()) as { id: string };

  redirectWith(`/admin/products/${productId}`, {
    notice: "Produk berhasil dibuat.",
  });
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const path = `/admin/products/${id}`;

  const parsed = productSchema.safeParse({
    id,
    categoryId: getString(formData, "categoryId"),
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    normalPrice: getString(formData, "normalPrice"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success || !id) {
    redirectWith(path, { error: "Data produk tidak valid." });
  }

  const response = await requestAdminProductApi({ body: JSON.stringify(parsed.data), method: "PATCH", path: `/v1/admin/products/${encodeURIComponent(id)}` });
  if (!response.ok) redirectWith(path, { error: await apiErrorMessage(response) });

  redirectWith(path, { notice: "Produk berhasil diperbarui." });
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const confirmed = getBoolean(formData, "confirmDelete");

  if (!id || !confirmed) {
    redirectWith("/admin/products", {
      error: "Centang konfirmasi sebelum menghapus produk.",
    });
  }

  const response = await requestAdminProductApi({ method: "DELETE", path: `/v1/admin/products/${encodeURIComponent(id)}` });
  if (!response.ok) redirectWith("/admin/products", { error: await apiErrorMessage(response) });

  redirectWith("/admin/products", { notice: "Produk berhasil dihapus." });
}

export async function toggleProductStatus(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const isActive = getBoolean(formData, "isActive");
  const returnTo = getString(formData, "returnTo") || "/admin/products";

  if (!id) {
    redirectWith(returnTo, { error: "Produk tidak valid." });
  }

  const response = await requestAdminProductApi({ body: JSON.stringify({ isActive }), method: "PATCH", path: `/v1/admin/products/${encodeURIComponent(id)}/status` });
  if (!response.ok) redirectWith(returnTo, { error: await apiErrorMessage(response) });

  redirectWith(returnTo, {
    notice: isActive ? "Produk diaktifkan." : "Produk dinonaktifkan.",
  });
}

export async function createVariant(formData: FormData) {
  await requireAdmin();
  const productId = getString(formData, "productId");
  const path = `/admin/products/${productId}`;

  const parsed = variantSchema.safeParse({
    productId,
    sku: getString(formData, "sku"),
    colorName: getString(formData, "colorName"),
    colorHex: getString(formData, "colorHex"),
    size: getString(formData, "size"),
    weightGram: getString(formData, "weightGram"),
    stock: getString(formData, "stock"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    redirectWith(path, { error: validationMessage(parsed.error) });
  }

  if (!(await ensureSku(parsed.data.sku))) {
    redirectWith(path, { error: "SKU varian sudah dipakai." });
  }

  await db.query(
    `
      INSERT INTO product_variants (
        id, "productId", sku, "colorName", "colorHex", size,
        "weightGram", stock, "isActive"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      randomUUID(),
      parsed.data.productId,
      parsed.data.sku,
      parsed.data.colorName,
      parsed.data.colorHex,
      parsed.data.size,
      parsed.data.weightGram,
      parsed.data.stock,
      parsed.data.isActive,
    ],
  );
  redirectWith(path, { notice: "Varian berhasil dibuat." });
}

export async function updateVariant(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const productId = getString(formData, "productId");
  const path = `/admin/products/${productId}`;

  const parsed = variantSchema.safeParse({
    id,
    productId,
    sku: getString(formData, "sku"),
    colorName: getString(formData, "colorName"),
    colorHex: getString(formData, "colorHex"),
    size: getString(formData, "size"),
    weightGram: getString(formData, "weightGram"),
    stock: getString(formData, "stock"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success || !id) {
    redirectWith(path, { error: "Data varian tidak valid." });
  }

  if (!(await ensureSku(parsed.data.sku, id))) {
    redirectWith(path, { error: "SKU varian sudah dipakai." });
  }

  await db.query(
    `
      UPDATE product_variants
      SET
        sku = $2,
        "colorName" = $3,
        "colorHex" = $4,
        size = $5,
        "weightGram" = $6,
        stock = $7,
        "isActive" = $8,
        "updatedAt" = NOW()
      WHERE id::text = $1
    `,
    [
      id,
      parsed.data.sku,
      parsed.data.colorName,
      parsed.data.colorHex,
      parsed.data.size,
      parsed.data.weightGram,
      parsed.data.stock,
      parsed.data.isActive,
    ],
  );

  redirectWith(path, { notice: "Varian berhasil diperbarui." });
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const productId = getString(formData, "productId");
  const path = `/admin/products/${productId}`;
  const confirmed = getBoolean(formData, "confirmDelete");

  if (!id || !confirmed) {
    redirectWith(path, {
      error: "Centang konfirmasi sebelum menghapus varian.",
    });
  }

  await db.query(`DELETE FROM product_variants WHERE id::text = $1`, [id]);
  redirectWith(path, { notice: "Varian berhasil dihapus." });
}

export async function createDiscount(formData: FormData) {
  await requireAdmin();
  const productId = getString(formData, "productId");
  const path = `/admin/products/${productId}`;

  const parsed = discountSchema.safeParse({
    productId,
    type: getString(formData, "type"),
    value: getString(formData, "value"),
    startsAt: getString(formData, "startsAt"),
    endsAt: getString(formData, "endsAt"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    redirectWith(path, { error: validationMessage(parsed.error) });
  }

  if (parsed.data.endsAt <= parsed.data.startsAt) {
    redirectWith(path, {
      error: "Waktu akhir diskon harus setelah waktu mulai.",
    });
  }

  await validateDiscountValue({
    path,
    productId,
    type: parsed.data.type,
    value: parsed.data.value,
  });

  await db.query(
    `
      INSERT INTO discounts (
        id, "productId", type, value, "startsAt", "endsAt", "isActive"
      )
      VALUES ($1, $2, $3::"DiscountType", $4, $5, $6, $7)
    `,
    [
      randomUUID(),
      parsed.data.productId,
      parsed.data.type,
      parsed.data.value,
      parsed.data.startsAt,
      parsed.data.endsAt,
      parsed.data.isActive,
    ],
  );
  redirectWith(path, { notice: "Diskon berhasil dibuat." });
}

export async function updateDiscount(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const productId = getString(formData, "productId");
  const path = `/admin/products/${productId}`;

  const parsed = discountSchema.safeParse({
    id,
    productId,
    type: getString(formData, "type"),
    value: getString(formData, "value"),
    startsAt: getString(formData, "startsAt"),
    endsAt: getString(formData, "endsAt"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success || !id) {
    redirectWith(path, { error: "Data diskon tidak valid." });
  }

  if (parsed.data.endsAt <= parsed.data.startsAt) {
    redirectWith(path, {
      error: "Waktu akhir diskon harus setelah waktu mulai.",
    });
  }

  await validateDiscountValue({
    path,
    productId,
    type: parsed.data.type,
    value: parsed.data.value,
  });

  await db.query(
    `
      UPDATE discounts
      SET
        type = $2::"DiscountType",
        value = $3,
        "startsAt" = $4,
        "endsAt" = $5,
        "isActive" = $6,
        "updatedAt" = NOW()
      WHERE id::text = $1
    `,
    [
      id,
      parsed.data.type,
      parsed.data.value,
      parsed.data.startsAt,
      parsed.data.endsAt,
      parsed.data.isActive,
    ],
  );

  redirectWith(path, { notice: "Diskon berhasil diperbarui." });
}

export async function deleteDiscount(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");
  const productId = getString(formData, "productId");
  const path = `/admin/products/${productId}`;
  const confirmed = getBoolean(formData, "confirmDelete");

  if (!id || !confirmed) {
    redirectWith(path, {
      error: "Centang konfirmasi sebelum menghapus diskon.",
    });
  }

  await db.query(`DELETE FROM discounts WHERE id::text = $1`, [id]);
  redirectWith(path, { notice: "Diskon berhasil dihapus." });
}

function getInitialVariant(formData: FormData) {
  const hasVariant = [
    "variantSku",
    "variantColorName",
    "variantSize",
    "variantWeightGram",
    "variantStock",
  ].some((field) => getString(formData, field));

  if (!hasVariant) {
    return null;
  }

  const parsed = variantSchema.omit({ productId: true }).safeParse({
    sku: getString(formData, "variantSku"),
    colorName: getString(formData, "variantColorName"),
    colorHex: getString(formData, "variantColorHex"),
    size: getString(formData, "variantSize"),
    weightGram: getString(formData, "variantWeightGram"),
    stock: getString(formData, "variantStock"),
    isActive: getBoolean(formData, "variantIsActive"),
  });

  if (!parsed.success) {
    redirectWith("/admin/products/new", {
      error: validationMessage(parsed.error),
    });
  }

  return parsed.data;
}

function getInitialDiscount(formData: FormData) {
  const hasDiscount = ["discountValue", "discountStartsAt", "discountEndsAt"].some(
    (field) => getString(formData, field),
  );

  if (!hasDiscount) {
    return null;
  }

  const parsed = discountSchema.omit({ productId: true }).safeParse({
    type: getString(formData, "discountType"),
    value: getString(formData, "discountValue"),
    startsAt: getString(formData, "discountStartsAt"),
    endsAt: getString(formData, "discountEndsAt"),
    isActive: getBoolean(formData, "discountIsActive"),
  });

  if (!parsed.success) {
    redirectWith("/admin/products/new", {
      error: validationMessage(parsed.error),
    });
  }

  if (parsed.data.endsAt <= parsed.data.startsAt) {
    redirectWith("/admin/products/new", {
      error: "Waktu akhir diskon harus setelah waktu mulai.",
    });
  }

  return parsed.data;
}
