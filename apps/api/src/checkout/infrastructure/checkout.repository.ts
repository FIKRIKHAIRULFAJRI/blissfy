import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { DiscountForPricing } from '../../products/domain/product-pricing';

export type CheckoutVariantRow = {
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
  variantIsActive: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type CheckoutDiscountRow = DiscountForPricing & {
  productId: string;
};

@Injectable()
export class CheckoutRepository {
  constructor(private readonly database: DatabaseService) {}

  async findVariants(variantIds: string[]): Promise<CheckoutVariantRow[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const result = await this.database.query<CheckoutVariantRow>(
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
            v."isActive" AS "variantIsActive",
            img.url AS "imageUrl",
            img."altText" AS "imageAlt"
          FROM product_variants v
          INNER JOIN products p
            ON p.id = v."productId"
          LEFT JOIN LATERAL (
            SELECT
              url,
              "altText"
            FROM product_images
            WHERE "productId" = p.id
            ORDER BY
              "isPrimary" DESC,
              "sortOrder" ASC,
              "createdAt" ASC,
              id ASC
            LIMIT 1
          ) img ON true
          WHERE v.id::text = ANY($1::text[])
        `,
      [variantIds],
    );

    return result.rows;
  }

  async findDiscounts(productIds: string[]): Promise<CheckoutDiscountRow[]> {
    if (productIds.length === 0) {
      return [];
    }

    const result = await this.database.query<CheckoutDiscountRow>(
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

    return result.rows;
  }
}
