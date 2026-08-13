import "server-only";

import { db } from "@/lib/db";
import type { ShippingRateQuote } from "@/lib/shipping/types";
import {
  getItemsHash,
  getQuotePayloadHash,
  scopeShippingQuotes,
  type ShippingQuotePayload,
} from "@/lib/orders/quote-contract";

export const SHIPPING_QUOTE_TTL_MINUTES = 10;
export { getItemsHash, getQuotePayloadHash, scopeShippingQuotes };
export type { ShippingQuotePayload };

export async function persistShippingQuotes({
  destination,
  items,
  originDistrictId,
  packagingWeightGram,
  quotes,
  totalProductWeightGram,
  totalWeightGram,
}: {
  destination: ShippingQuotePayload["destination"];
  items: ShippingQuotePayload["items"];
  originDistrictId: string;
  packagingWeightGram: number;
  quotes: ShippingRateQuote[];
  totalProductWeightGram: number;
  totalWeightGram: number;
}) {
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

  await db.query(
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
