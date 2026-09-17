import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import type { CloudinaryProductImageUpload } from '../domain/admin-product-image.types';
import type { DiscountForPricing } from '../domain/product-pricing';

export class ProductNotFoundError extends Error {}
export class ProductImageNotFoundError extends Error {}
export class ProductImageLimitError extends Error {}
export class ProductImageOrderError extends Error {}

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  normalPrice: number;
};

export type ImageRow = {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  publicId: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
};

export type VariantRow = {
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

export type DiscountRow = DiscountForPricing & {
  id: string;
  productId: string;
};

export type ProductForImageManagement = {
  id: string;
  name: string;
};

export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
};

export type AdminProductRow = {
  id: string; categoryId: string; slug: string; name: string; description: string;
  normalPrice: number; isActive: boolean; categoryName: string;
  variantCount: number; totalStock: number; activeDiscountCount: number; imageCount: number;
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly database: DatabaseService) {}

  async listAdminCategories(): Promise<AdminCategoryRow[]> {
    const result = await this.database.query<AdminCategoryRow>(
      this.adminCategoriesQuery(),
    );
    return result.rows;
  }

  async findAdminCategory(categoryId: string): Promise<AdminCategoryRow | null> {
    const result = await this.database.query<AdminCategoryRow>(
      this.adminCategoriesQuery('WHERE c.id::text = $1'),
      [categoryId],
    );
    return result.rows[0] ?? null;
  }

  async findAdminCategoryBySlug(slug: string): Promise<{ id: string } | null> {
    const result = await this.database.query<{ id: string }>(
      `SELECT id::text AS id FROM categories WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return result.rows[0] ?? null;
  }

  async createAdminCategory(input: {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  }): Promise<AdminCategoryRow> {
    const result = await this.database.query<AdminCategoryRow>(
      `
        WITH created AS (
          INSERT INTO categories (id, slug, name, description, "isActive")
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        )
        ${this.adminCategoriesQuery('WHERE c.id = (SELECT id FROM created)')}
      `,
      [
        randomUUID(),
        input.slug,
        input.name,
        input.description ?? null,
        input.isActive,
      ],
    );
    return result.rows[0]!;
  }

  async updateAdminCategory(
    categoryId: string,
    input: {
      name: string;
      slug: string;
      description?: string;
      isActive: boolean;
    },
  ): Promise<AdminCategoryRow | null> {
    const result = await this.database.query<AdminCategoryRow>(
      `
        WITH updated AS (
          UPDATE categories
          SET name = $2, slug = $3, description = $4, "isActive" = $5,
              "updatedAt" = NOW()
          WHERE id::text = $1
          RETURNING id
        )
        ${this.adminCategoriesQuery('WHERE c.id = (SELECT id FROM updated)')}
      `,
      [
        categoryId,
        input.name,
        input.slug,
        input.description ?? null,
        input.isActive,
      ],
    );
    return result.rows[0] ?? null;
  }

  async deleteAdminCategory(categoryId: string): Promise<void> {
    await this.database.query(`DELETE FROM categories WHERE id::text = $1`, [
      categoryId,
    ]);
  }

  async listAdminProducts(input: { page: number; q?: string; status?: boolean }): Promise<{ products: AdminProductRow[]; total: number }> {
    const filters: string[] = []; const values: unknown[] = [];
    if (input.status !== undefined) { values.push(input.status); filters.push(`p."isActive" = $${values.length}`); }
    if (input.q?.trim()) { values.push(`%${input.q.trim()}%`); filters.push(`(p.name ILIKE $${values.length} OR p.slug ILIKE $${values.length})`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const limit = 8; values.push(limit, (input.page - 1) * limit);
    const [rows, count] = await Promise.all([
      this.database.query<AdminProductRow>(`${this.adminProductsQuery(where)} LIMIT $${values.length - 1} OFFSET $${values.length}`, values),
      this.database.query<{ total: number }>(`SELECT count(*)::integer AS total FROM products p ${where}`, values.slice(0, -2)),
    ]);
    return { products: rows.rows, total: count.rows[0]?.total ?? 0 };
  }

  async findAdminProduct(id: string): Promise<AdminProductRow | null> {
    const result = await this.database.query<AdminProductRow>(this.adminProductsQuery('WHERE p.id::text = $1'), [id]);
    return result.rows[0] ?? null;
  }

  async findAdminProductBySlug(slug: string): Promise<{ id: string } | null> {
    const result = await this.database.query<{ id: string }>('SELECT id::text AS id FROM products WHERE slug = $1 LIMIT 1', [slug]);
    return result.rows[0] ?? null;
  }

  async findAdminVariantBySku(sku: string): Promise<{ id: string } | null> {
    const result = await this.database.query<{ id: string }>('SELECT id::text AS id FROM product_variants WHERE sku = $1 LIMIT 1', [sku]);
    return result.rows[0] ?? null;
  }

  async createAdminProduct(input: { categoryId: string; slug: string; name: string; description: string; normalPrice: number; isActive: boolean; initialVariant?: { sku: string; colorName: string; colorHex?: string; size: string; weightGram: number; stock: number; isActive: boolean }; initialDiscount?: { type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number; startsAt: string; endsAt: string; isActive: boolean } }): Promise<AdminProductRow> {
    const id = randomUUID();
    await this.database.withTransaction(async (client) => {
      await client.query('INSERT INTO products (id, "categoryId", slug, name, description, "normalPrice", "isActive") VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, input.categoryId, input.slug, input.name, input.description, input.normalPrice, input.isActive]);
      if (input.initialVariant) await client.query('INSERT INTO product_variants (id, "productId", sku, "colorName", "colorHex", size, "weightGram", stock, "isActive") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [randomUUID(), id, input.initialVariant.sku, input.initialVariant.colorName, input.initialVariant.colorHex ?? null, input.initialVariant.size, input.initialVariant.weightGram, input.initialVariant.stock, input.initialVariant.isActive]);
      if (input.initialDiscount) await client.query('INSERT INTO discounts (id, "productId", type, value, "startsAt", "endsAt", "isActive") VALUES ($1,$2,$3::"DiscountType",$4,$5,$6,$7)', [randomUUID(), id, input.initialDiscount.type, input.initialDiscount.value, input.initialDiscount.startsAt, input.initialDiscount.endsAt, input.initialDiscount.isActive]);
    });
    return (await this.findAdminProduct(id))!;
  }

  async updateAdminProduct(id: string, input: { categoryId: string; slug: string; name: string; description: string; normalPrice: number; isActive: boolean }): Promise<AdminProductRow | null> {
    const result = await this.database.query<{ id: string }>('UPDATE products SET "categoryId"=$2, slug=$3, name=$4, description=$5, "normalPrice"=$6, "isActive"=$7, "updatedAt"=NOW() WHERE id::text=$1 RETURNING id::text AS id', [id, input.categoryId, input.slug, input.name, input.description, input.normalPrice, input.isActive]);
    return result.rows[0] ? this.findAdminProduct(id) : null;
  }

  async updateAdminProductStatus(id: string, isActive: boolean): Promise<AdminProductRow | null> {
    const result = await this.database.query<{ id: string }>('UPDATE products SET "isActive" = $2, "updatedAt" = NOW() WHERE id::text = $1 RETURNING id::text AS id', [id, isActive]);
    return result.rows[0] ? this.findAdminProduct(id) : null;
  }

  async deleteAdminProduct(id: string): Promise<void> { await this.database.query('DELETE FROM products WHERE id::text = $1', [id]); }

  private adminProductsQuery(where = ''): string {
    return `SELECT p.id::text AS id, p."categoryId"::text AS "categoryId", p.slug, p.name, p.description, p."normalPrice" AS "normalPrice", p."isActive" AS "isActive", c.name AS "categoryName", COALESCE(v."variantCount", 0)::integer AS "variantCount", COALESCE(v."totalStock", 0)::integer AS "totalStock", COALESCE(d."activeDiscountCount", 0)::integer AS "activeDiscountCount", COALESCE(i."imageCount", 0)::integer AS "imageCount" FROM products p INNER JOIN categories c ON c.id = p."categoryId" LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS "variantCount", COALESCE(SUM(stock), 0)::integer AS "totalStock" FROM product_variants WHERE "productId" = p.id) v ON true LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS "activeDiscountCount" FROM discounts WHERE "productId" = p.id AND "isActive" = true) d ON true LEFT JOIN LATERAL (SELECT COUNT(*)::integer AS "imageCount" FROM product_images WHERE "productId" = p.id) i ON true ${where} ORDER BY p."updatedAt" DESC`;
  }

  private adminCategoriesQuery(whereClause = ''): string {
    return `
      SELECT
        c.id::text AS id,
        c.slug,
        c.name,
        c.description,
        c."isActive" AS "isActive",
        COUNT(p.id)::integer AS "productCount"
      FROM categories c
      LEFT JOIN products p ON p."categoryId" = c.id
      ${whereClause}
      GROUP BY c.id, c.slug, c.name, c.description, c."isActive"
      ORDER BY c.name ASC
    `;
  }

  async findActiveProducts(limit?: number): Promise<ProductRow[]> {
    const result = await this.database.query<ProductRow>(
      `
        SELECT
          p.id::text AS id,
          p.slug,
          p.name,
          p.description,
          c.name AS "categoryName",
          p."normalPrice" AS "normalPrice"
        FROM products p
        INNER JOIN categories c ON c.id = p."categoryId"
        WHERE p."isActive" = true
        ORDER BY p."createdAt" DESC
        ${limit ? 'LIMIT $1' : ''}
      `,
      limit ? [limit] : [],
    );

    return result.rows;
  }

  async findActiveProductBySlug(slug: string): Promise<ProductRow | null> {
    const result = await this.database.query<ProductRow>(
      `
        SELECT
          p.id::text AS id,
          p.slug,
          p.name,
          p.description,
          c.name AS "categoryName",
          p."normalPrice" AS "normalPrice"
        FROM products p
        INNER JOIN categories c ON c.id = p."categoryId"
        WHERE p.slug = $1
          AND p."isActive" = true
        LIMIT 1
      `,
      [slug],
    );

    return result.rows[0] ?? null;
  }

  async findImages(productIds: string[]): Promise<ImageRow[]> {
    const result = await this.database.query<ImageRow>(
      `
        SELECT
          id::text AS id,
          "productId"::text AS "productId",
          url,
          "altText",
          "publicId",
          "sortOrder",
          "isPrimary",
          "createdAt"
        FROM product_images
        WHERE "productId"::text = ANY($1::text[])
        ORDER BY
          "productId" ASC,
          "isPrimary" DESC,
          "sortOrder" ASC,
          "createdAt" ASC,
          id ASC
      `,
      [productIds],
    );

    return result.rows;
  }

  async findVariants(productIds: string[]): Promise<VariantRow[]> {
    const result = await this.database.query<VariantRow>(
      `
        SELECT
          id::text AS id,
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
        ORDER BY "colorName" ASC, size ASC
      `,
      [productIds],
    );

    return result.rows;
  }

  async findDiscounts(productIds: string[]): Promise<DiscountRow[]> {
    const result = await this.database.query<DiscountRow>(
      `
        SELECT
          id::text AS id,
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

    return result.rows;
  }

  async findProductForImageManagement(
    productId: string,
  ): Promise<ProductForImageManagement | null> {
    const result = await this.database.query<ProductForImageManagement>(
      `
        SELECT id::text AS id, name
        FROM products
        WHERE id::text = $1
        LIMIT 1
      `,
      [productId],
    );

    return result.rows[0] ?? null;
  }

  async countProductImages(productId: string): Promise<number> {
    const result = await this.database.query<{ count: number }>(
      `
        SELECT count(*)::integer AS count
        FROM product_images
        WHERE "productId"::text = $1
      `,
      [productId],
    );

    return result.rows[0]?.count ?? 0;
  }

  async listProductImages(productId: string): Promise<ImageRow[]> {
    const result = await this.database.query<ImageRow>(
      this.productImagesForManagementQuery(),
      [productId],
    );

    return result.rows;
  }

  async findProductImageForManagement({
    imageId,
    productId,
  }: {
    imageId: string;
    productId: string;
  }): Promise<ImageRow | null> {
    const result = await this.database.query<ImageRow>(
      `
        SELECT
          id::text AS id,
          "productId"::text AS "productId",
          url,
          "altText",
          "publicId",
          "sortOrder",
          "isPrimary",
          "createdAt"
        FROM product_images
        WHERE id::text = $1
          AND "productId"::text = $2
        LIMIT 1
      `,
      [imageId, productId],
    );

    return result.rows[0] ?? null;
  }

  async createProductImages({
    altText,
    maxImages,
    productId,
    uploads,
  }: {
    altText: string;
    maxImages: number;
    productId: string;
    uploads: CloudinaryProductImageUpload[];
  }): Promise<ImageRow[]> {
    return this.database.withTransaction(async (client) => {
      await this.lockProductImages(client, productId);

      const product = await client.query<{ id: string }>(
        `SELECT id::text AS id FROM products WHERE id::text = $1 LIMIT 1`,
        [productId],
      );

      if (!product.rows[0]) {
        throw new ProductNotFoundError();
      }

      const existing = await client.query<{
        count: number;
        maxSortOrder: number | null;
        hasPrimary: boolean;
      }>(
        `
          SELECT
            count(*)::integer AS count,
            max("sortOrder")::integer AS "maxSortOrder",
            coalesce(bool_or("isPrimary"), false) AS "hasPrimary"
          FROM product_images
          WHERE "productId"::text = $1
        `,
        [productId],
      );
      const currentCount = existing.rows[0]?.count ?? 0;

      if (currentCount + uploads.length > maxImages) {
        throw new ProductImageLimitError();
      }

      const firstSortOrder = (existing.rows[0]?.maxSortOrder ?? -1) + 1;
      const shouldAssignPrimary = !(existing.rows[0]?.hasPrimary ?? false);

      for (const [index, upload] of uploads.entries()) {
        await client.query(
          `
            INSERT INTO product_images (
              id,
              "productId",
              url,
              "publicId",
              "altText",
              "sortOrder",
              "isPrimary"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            randomUUID(),
            productId,
            upload.secureUrl,
            upload.publicId,
            altText,
            firstSortOrder + index,
            shouldAssignPrimary && index === 0,
          ],
        );
      }

      return this.listProductImagesWithClient(client, productId);
    });
  }

  async setPrimaryProductImage({
    imageId,
    productId,
  }: {
    imageId: string;
    productId: string;
  }): Promise<ImageRow[]> {
    return this.database.withTransaction(async (client) => {
      await this.lockProductImages(client, productId);

      const image = await client.query<{ id: string }>(
        `
          SELECT id::text AS id
          FROM product_images
          WHERE id::text = $1
            AND "productId"::text = $2
          FOR UPDATE
        `,
        [imageId, productId],
      );

      if (!image.rows[0]) {
        throw new ProductImageNotFoundError();
      }

      await client.query(
        `
          UPDATE product_images
          SET "isPrimary" = false
          WHERE "productId"::text = $1
            AND "isPrimary" = true
        `,
        [productId],
      );
      await client.query(
        `
          UPDATE product_images
          SET "isPrimary" = true
          WHERE id::text = $1
            AND "productId"::text = $2
        `,
        [imageId, productId],
      );

      return this.listProductImagesWithClient(client, productId);
    });
  }

  async reorderProductImages({
    imageIds,
    productId,
  }: {
    imageIds: string[];
    productId: string;
  }): Promise<ImageRow[]> {
    return this.database.withTransaction(async (client) => {
      await this.lockProductImages(client, productId);

      const existing = await client.query<{ id: string }>(
        `
          SELECT id::text AS id
          FROM product_images
          WHERE "productId"::text = $1
          ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
          FOR UPDATE
        `,
        [productId],
      );
      const existingIds = existing.rows.map((image) => image.id);

      if (
        existingIds.length !== imageIds.length ||
        existingIds.some((id) => !imageIds.includes(id))
      ) {
        throw new ProductImageOrderError();
      }

      if (imageIds.length > 0) {
        const shift = imageIds.length + 1;

        await client.query(
          `
            UPDATE product_images
            SET "sortOrder" = "sortOrder" + $2
            WHERE "productId"::text = $1
          `,
          [productId, shift],
        );
        await client.query(
          `
            WITH desired_order AS (
              SELECT *
              FROM unnest($2::text[], $3::integer[])
                AS requested(id, "sortOrder")
            )
            UPDATE product_images image
            SET "sortOrder" = desired_order."sortOrder"
            FROM desired_order
            WHERE image.id::text = desired_order.id
              AND image."productId"::text = $1
          `,
          [productId, imageIds, imageIds.map((_, index) => index)],
        );
      }

      return this.listProductImagesWithClient(client, productId);
    });
  }

  async deleteProductImageMetadata({
    imageId,
    productId,
  }: {
    imageId: string;
    productId: string;
  }): Promise<ImageRow[]> {
    return this.database.withTransaction(async (client) => {
      await this.lockProductImages(client, productId);

      const target = await client.query<{
        id: string;
        isPrimary: boolean;
      }>(
        `
          SELECT id::text AS id, "isPrimary"
          FROM product_images
          WHERE id::text = $1
            AND "productId"::text = $2
          FOR UPDATE
        `,
        [imageId, productId],
      );
      const image = target.rows[0];

      if (!image) {
        throw new ProductImageNotFoundError();
      }

      await client.query(
        `
          DELETE FROM product_images
          WHERE id::text = $1
            AND "productId"::text = $2
        `,
        [imageId, productId],
      );

      const remaining = await client.query<{
        id: string;
        isPrimary: boolean;
      }>(
        `
          SELECT id::text AS id, "isPrimary"
          FROM product_images
          WHERE "productId"::text = $1
          ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
          FOR UPDATE
        `,
        [productId],
      );

      if (remaining.rows.length > 0) {
        const imageIds = remaining.rows.map(
          (remainingImage) => remainingImage.id,
        );
        const shift = imageIds.length + 1;

        await client.query(
          `
            UPDATE product_images
            SET "sortOrder" = "sortOrder" + $2
            WHERE "productId"::text = $1
          `,
          [productId, shift],
        );
        await client.query(
          `
            WITH desired_order AS (
              SELECT *
              FROM unnest($2::text[], $3::integer[])
                AS requested(id, "sortOrder")
            )
            UPDATE product_images image
            SET "sortOrder" = desired_order."sortOrder"
            FROM desired_order
            WHERE image.id::text = desired_order.id
              AND image."productId"::text = $1
          `,
          [productId, imageIds, imageIds.map((_, index) => index)],
        );

        if (
          image.isPrimary ||
          !remaining.rows.some((remainingImage) => remainingImage.isPrimary)
        ) {
          await client.query(
            `
              UPDATE product_images
              SET "isPrimary" = true
              WHERE id::text = $1
                AND "productId"::text = $2
            `,
            [imageIds[0], productId],
          );
        }
      }

      return this.listProductImagesWithClient(client, productId);
    });
  }

  private async lockProductImages(
    client: PoolClient,
    productId: string,
  ): Promise<void> {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
      productId,
    ]);
  }

  private async listProductImagesWithClient(
    client: PoolClient,
    productId: string,
  ): Promise<ImageRow[]> {
    const result = await client.query<ImageRow>(
      this.productImagesForManagementQuery(),
      [productId],
    );

    return result.rows;
  }

  private productImagesForManagementQuery(): string {
    return `
      SELECT
        id::text AS id,
        "productId"::text AS "productId",
        url,
        "altText",
        "publicId",
        "sortOrder",
        "isPrimary",
        "createdAt"
      FROM product_images
      WHERE "productId"::text = $1
      ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
    `;
  }
}
