import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  getItemsHash,
  getQuotePayloadHash,
  type ShippingQuotePayload,
} from '../domain/quote-contract';
import type { ShippingRateQuote } from '../domain/shipping.types';

export type ShippingVariantRow = {
  variantId: string;
  productId: string;
  productIsActive: boolean;
  variantIsActive: boolean;
  weightGram: number;
  packagingWeightGram: number | null;
};

export const SHIPPING_QUOTE_TTL_MINUTES = 10;

@Injectable()
export class ShippingRepository {
  constructor(private readonly database: DatabaseService) {}

  async findVariants(variantIds: string[]): Promise<ShippingVariantRow[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const result = await this.database.query<ShippingVariantRow>(
      `
          SELECT
            v.id::text AS "variantId",
            v."productId"::text AS "productId",
            p."isActive" AS "productIsActive",
            v."isActive" AS "variantIsActive",
            v."weightGram",
            settings."defaultPackagingWeightGram" AS "packagingWeightGram"
          FROM product_variants v
          INNER JOIN products p
            ON p.id = v."productId"
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

    return result.rows;
  }

  async persistShippingQuotes({
    destination,
    items,
    originDistrictId,
    packagingWeightGram,
    quotes,
    totalProductWeightGram,
    totalWeightGram,
  }: {
    destination: ShippingQuotePayload['destination'];
    items: ShippingQuotePayload['items'];
    originDistrictId: string;
    packagingWeightGram: number;
    quotes: ShippingRateQuote[];
    totalProductWeightGram: number;
    totalWeightGram: number;
  }): Promise<void> {
    if (quotes.length === 0) {
      return;
    }

    const quotePayload: ShippingQuotePayload = {
      items,
      destination,
      totalProductWeightGram,
      packagingWeightGram,
      totalWeightGram,
    };

    const payloadHash = getQuotePayloadHash(quotePayload);

    const itemsHash = getItemsHash(items);

    await this.database.query(
      `
        INSERT INTO checkout_shipping_quotes (
          "quoteId",
          "payloadHash",
          "itemsHash",
          "originDistrictId",
          "destinationProvinceId",
          "destinationProvinceName",
          "destinationCityId",
          "destinationCityName",
          "destinationDistrictId",
          "destinationDistrictName",
          "courierCode",
          "courierName",
          "serviceCode",
          "serviceName",
          "estimatedDelivery",
          "shippingCost",
          "totalProductWeightGram",
          "packagingWeightGram",
          "totalWeightGram",
          "expiresAt"
        )
        SELECT
          quote."quoteId",
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          quote."courierCode",
          quote."courierName",
          quote."serviceCode",
          quote."serviceName",
          quote."estimatedDelivery",
          quote.cost,
          $10,
          $11,
          $12,
          NOW() + ($13::int * INTERVAL '1 minute')
        FROM jsonb_to_recordset($14::jsonb) AS quote(
          "quoteId" text,
          "courierCode" text,
          "courierName" text,
          "serviceCode" text,
          "serviceName" text,
          "estimatedDelivery" text,
          cost int
        )
        ON CONFLICT ("quoteId") DO UPDATE SET
          "payloadHash" = EXCLUDED."payloadHash",
          "itemsHash" = EXCLUDED."itemsHash",
          "originDistrictId" = EXCLUDED."originDistrictId",
          "destinationProvinceId" = EXCLUDED."destinationProvinceId",
          "destinationProvinceName" = EXCLUDED."destinationProvinceName",
          "destinationCityId" = EXCLUDED."destinationCityId",
          "destinationCityName" = EXCLUDED."destinationCityName",
          "destinationDistrictId" = EXCLUDED."destinationDistrictId",
          "destinationDistrictName" = EXCLUDED."destinationDistrictName",
          "courierCode" = EXCLUDED."courierCode",
          "courierName" = EXCLUDED."courierName",
          "serviceCode" = EXCLUDED."serviceCode",
          "serviceName" = EXCLUDED."serviceName",
          "estimatedDelivery" = EXCLUDED."estimatedDelivery",
          "shippingCost" = EXCLUDED."shippingCost",
          "totalProductWeightGram" = EXCLUDED."totalProductWeightGram",
          "packagingWeightGram" = EXCLUDED."packagingWeightGram",
          "totalWeightGram" = EXCLUDED."totalWeightGram",
          "expiresAt" = EXCLUDED."expiresAt"
      `,
      [
        payloadHash,
        itemsHash,
        originDistrictId,
        destination.provinceId,
        destination.provinceName,
        destination.cityId,
        destination.cityName,
        destination.districtId,
        destination.districtName,
        totalProductWeightGram,
        packagingWeightGram,
        totalWeightGram,
        SHIPPING_QUOTE_TTL_MINUTES,
        JSON.stringify(
          quotes.map((quote) => ({
            quoteId: quote.quoteId,
            courierCode: quote.courierCode,
            courierName: quote.courierName,
            serviceCode: quote.serviceCode,
            serviceName: quote.serviceName,
            estimatedDelivery: quote.estimatedDelivery,
            cost: quote.cost,
          })),
        ),
      ],
    );
  }
}
