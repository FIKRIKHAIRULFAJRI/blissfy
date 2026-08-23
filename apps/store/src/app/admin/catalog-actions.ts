"use server";

import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
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

const imageUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || "/products/placeholder-ivory.svg")
  .refine(
    (value) => value.startsWith("/") || URL.canParse(value),
    "URL gambar harus berupa path lokal atau URL lengkap.",
  );

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter."),
  slug: slugSchema,
  description: z.string().trim().optional(),
  isActive: z.boolean(),
});

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
  imageUrl: imageUrlSchema,
  imageAlt: z.string().trim().optional(),
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

async function ensureCategorySlug(slug: string, currentId?: string) {
  const result = await db.query<{ id: string }>(
    `SELECT id::text FROM categories WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  const existing = result.rows[0];
  return !existing || existing.id === currentId;
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

  const parsed = categorySchema.safeParse({
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    redirectWith("/admin/categories", { error: validationMessage(parsed.error) });
  }

  if (!(await ensureCategorySlug(parsed.data.slug))) {
    redirectWith("/admin/categories", { error: "Slug kategori sudah dipakai." });
  }

  try {
    await db.query(
      `
        INSERT INTO categories (id, slug, name, description, "isActive")
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        randomUUID(),
        parsed.data.slug,
        parsed.data.name,
        parsed.data.description || null,
        parsed.data.isActive,
      ],
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/categories", {
        error: "Slug kategori sudah dipakai.",
      });
    }

    throw error;
  }

  redirectWith("/admin/categories", { notice: "Kategori berhasil dibuat." });
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, "id");

  const parsed = categorySchema.safeParse({
    id,
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success || !id) {
    redirectWith("/admin/categories", { error: "Data kategori tidak valid." });
  }

  if (!(await ensureCategorySlug(parsed.data.slug, id))) {
    redirectWith("/admin/categories", { error: "Slug kategori sudah dipakai." });
  }

  await db.query(
    `
      UPDATE categories
      SET
        name = $2,
        slug = $3,
        description = $4,
        "isActive" = $5,
        "updatedAt" = NOW()
      WHERE id::text = $1
    `,
    [
      id,
      parsed.data.name,
      parsed.data.slug,
      parsed.data.description || null,
      parsed.data.isActive,
    ],
  );

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

  const productCount = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products WHERE "categoryId"::text = $1`,
    [id],
  );

  if (Number(productCount.rows[0]?.count ?? "0") > 0) {
    redirectWith("/admin/categories", {
      error:
        "Kategori tidak bisa dihapus karena masih dipakai produk. Nonaktifkan kategori jika perlu disembunyikan.",
    });
  }

  await db.query(`DELETE FROM categories WHERE id::text = $1`, [id]);
  redirectWith("/admin/categories", { notice: "Kategori berhasil dihapus." });
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    categoryId: getString(formData, "categoryId"),
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    normalPrice: getString(formData, "normalPrice"),
    imageUrl: getString(formData, "imageUrl"),
    imageAlt: getString(formData, "imageAlt"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    redirectWith("/admin/products/new", {
      error: validationMessage(parsed.error),
    });
  }

  if (!(await ensureProductSlug(parsed.data.slug))) {
    redirectWith("/admin/products/new", { error: "Slug produk sudah dipakai." });
  }

  const initialVariant = getInitialVariant(formData);
  const initialDiscount = getInitialDiscount(formData);

  if (initialVariant && !(await ensureSku(initialVariant.sku))) {
    redirectWith("/admin/products/new", { error: "SKU varian sudah dipakai." });
  }

  if (initialDiscount?.type === "PERCENTAGE" && initialDiscount.value > 90) {
    redirectWith("/admin/products/new", {
      error: "Diskon persentase maksimal 90% agar harga tidak menjadi nol.",
    });
  }

  if (
    initialDiscount?.type === "FIXED_AMOUNT" &&
    initialDiscount.value >= parsed.data.normalPrice
  ) {
    redirectWith("/admin/products/new", {
      error: "Diskon nominal harus lebih kecil dari harga normal produk.",
    });
  }

  const productId = randomUUID();

  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO products (
          id, "categoryId", slug, name, description, "normalPrice", "isActive"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        productId,
        parsed.data.categoryId,
        parsed.data.slug,
        parsed.data.name,
        parsed.data.description,
        parsed.data.normalPrice,
        parsed.data.isActive,
      ],
    );

    await client.query(
      `
        INSERT INTO product_images (
          id, "productId", url, "altText", "sortOrder", "isPrimary"
        )
        VALUES ($1, $2, $3, $4, 0, true)
      `,
      [
        randomUUID(),
        productId,
        parsed.data.imageUrl,
        parsed.data.imageAlt || parsed.data.name,
      ],
    );

    if (initialVariant) {
      await client.query(
        `
          INSERT INTO product_variants (
            id, "productId", sku, "colorName", "colorHex", size,
            "weightGram", stock, "isActive"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          randomUUID(),
          productId,
          initialVariant.sku,
          initialVariant.colorName,
          initialVariant.colorHex,
          initialVariant.size,
          initialVariant.weightGram,
          initialVariant.stock,
          initialVariant.isActive,
        ],
      );
    }

    if (initialDiscount) {
      await client.query(
        `
          INSERT INTO discounts (
            id, "productId", type, value, "startsAt", "endsAt", "isActive"
          )
          VALUES ($1, $2, $3::"DiscountType", $4, $5, $6, $7)
        `,
        [
          randomUUID(),
          productId,
          initialDiscount.type,
          initialDiscount.value,
          initialDiscount.startsAt,
          initialDiscount.endsAt,
          initialDiscount.isActive,
        ],
      );
    }
  });

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
    imageUrl: getString(formData, "imageUrl"),
    imageAlt: getString(formData, "imageAlt"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success || !id) {
    redirectWith(path, { error: "Data produk tidak valid." });
  }

  if (!(await ensureProductSlug(parsed.data.slug, id))) {
    redirectWith(path, { error: "Slug produk sudah dipakai." });
  }

  await withTransaction(async (client) => {
    await client.query(
      `
        UPDATE products
        SET
          "categoryId" = $2,
          name = $3,
          slug = $4,
          description = $5,
          "normalPrice" = $6,
          "isActive" = $7,
          "updatedAt" = NOW()
        WHERE id::text = $1
      `,
      [
        id,
        parsed.data.categoryId,
        parsed.data.name,
        parsed.data.slug,
        parsed.data.description,
        parsed.data.normalPrice,
        parsed.data.isActive,
      ],
    );

    const primary = await client.query<{ id: string }>(
      `
        SELECT id::text
        FROM product_images
        WHERE "productId"::text = $1
          AND "isPrimary" = true
        ORDER BY "sortOrder" ASC
        LIMIT 1
      `,
      [id],
    );
    const primaryId = primary.rows[0]?.id;

    if (primaryId) {
      await client.query(
        `
          UPDATE product_images
          SET url = $2, "altText" = $3
          WHERE id::text = $1
        `,
        [primaryId, parsed.data.imageUrl, parsed.data.imageAlt || parsed.data.name],
      );
    } else {
      await client.query(
        `
          INSERT INTO product_images (
            id, "productId", url, "altText", "sortOrder", "isPrimary"
          )
          VALUES ($1, $2, $3, $4, 0, true)
        `,
        [
          randomUUID(),
          id,
          parsed.data.imageUrl,
          parsed.data.imageAlt || parsed.data.name,
        ],
      );
    }
  });

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

  const [variantCount, discountCount] = await Promise.all([
    db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM product_variants WHERE "productId"::text = $1`,
      [id],
    ),
    db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM discounts WHERE "productId"::text = $1`,
      [id],
    ),
  ]);

  if (
    Number(variantCount.rows[0]?.count ?? "0") > 0 ||
    Number(discountCount.rows[0]?.count ?? "0") > 0
  ) {
    redirectWith("/admin/products", {
      error:
        "Produk tidak bisa dihapus karena masih memiliki varian atau diskon. Nonaktifkan produk untuk mengarsipkan.",
    });
  }

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM product_images WHERE "productId"::text = $1`, [
      id,
    ]);
    await client.query(`DELETE FROM products WHERE id::text = $1`, [id]);
  });

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

  await db.query(
    `UPDATE products SET "isActive" = $2, "updatedAt" = NOW() WHERE id::text = $1`,
    [id, isActive],
  );

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
