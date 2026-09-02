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

@Injectable()
export class ProductsRepository {
  constructor(private readonly database: DatabaseService) {}

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
