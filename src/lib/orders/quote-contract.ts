import type { ShippingRateQuote } from "@/lib/shipping/types";
import { hashPayload } from "@/lib/orders/hash";

export type ShippingQuotePayload = {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  destination: {
    provinceId: string;
    provinceName: string;
    cityId: string;
    cityName: string;
    districtId: string;
    districtName: string;
  };
  totalProductWeightGram: number;
  packagingWeightGram: number;
  totalWeightGram: number;
};

export function getQuotePayloadHash(payload: ShippingQuotePayload) {
  return hashPayload(payload);
}

export function getItemsHash(items: ShippingQuotePayload["items"]) {
  return hashPayload(
    items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  );
}

export function scopeShippingQuotes(
  payload: ShippingQuotePayload,
  quotes: ShippingRateQuote[],
) {
  const payloadHash = getQuotePayloadHash(payload);

  return quotes.map((quote) => ({
    ...quote,
    quoteId: hashPayload({
      payloadHash,
      providerQuoteId: quote.quoteId,
    }),
  }));
}
