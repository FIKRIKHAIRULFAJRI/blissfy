import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { DiscountForPricing } from '../domain/product-pricing';

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
          "altText"
        FROM product_images
        WHERE "productId"::text = ANY($1::text[])
        ORDER BY "isPrimary" DESC, "sortOrder" ASC
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
}
