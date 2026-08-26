import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { DiscountForPricing } from '../../products/domain/product-pricing';

export type OrderCatalogRow = {
  variantId: string;
  productId: string;
  productName: string;
  productIsActive: boolean;

  normalPrice: number;

  sku: string;
  colorName: string;
  size: string;

  weightGram: number;
  variantIsActive: boolean;

  packagingWeightGram: number | null;
};

export type OrderDiscountRow = DiscountForPricing & {
  productId: string;
};

@Injectable()
export class OrderRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findCatalogRows(variantIds: string[]): Promise<OrderCatalogRow[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.query<OrderCatalogRow>(
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
            v."isActive" AS "variantIsActive",
            settings."defaultPackagingWeightGram"
              AS "packagingWeightGram"
          FROM product_variants v

          INNER JOIN products p
            ON p.id = v."productId"

          LEFT JOIN LATERAL (
            SELECT
              "defaultPackagingWeightGram"
            FROM store_settings
            ORDER BY "createdAt" ASC
            LIMIT 1
          ) settings ON true

          WHERE v.id::text = ANY($1::text[])
        `,
      [variantIds],
    );

    return result.rows;
  }

  async findDiscounts(productIds: string[]): Promise<OrderDiscountRow[]> {
    if (productIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.query<OrderDiscountRow>(
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
