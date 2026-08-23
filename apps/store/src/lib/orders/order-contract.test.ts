import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPayload } from "@/lib/orders/hash";
import {
  getItemsHash,
  getQuotePayloadHash,
} from "@/lib/orders/quote-contract";

describe("order idempotency and quote contract", () => {
  it("hashPayload is stable for objects with the same semantic fields", () => {
    const left = hashPayload({
      shippingQuoteId: "quote-1",
      items: [{ variantId: "variant-1", productId: "product-1", quantity: 1 }],
      destination: { districtId: "6132", cityId: "591" },
    });
    const right = hashPayload({
      destination: { cityId: "591", districtId: "6132" },
      items: [{ productId: "product-1", quantity: 1, variantId: "variant-1" }],
      shippingQuoteId: "quote-1",
    });

    assert.equal(left, right);
  });

  it("items hash changes when quantity changes", () => {
    const first = getItemsHash([
      { productId: "product-1", variantId: "variant-1", quantity: 1 },
    ]);
    const second = getItemsHash([
      { productId: "product-1", variantId: "variant-1", quantity: 2 },
    ]);

    assert.notEqual(first, second);
  });

  it("quote hash changes when destination or weight changes", () => {
    const basePayload = {
      items: [{ productId: "product-1", variantId: "variant-1", quantity: 1 }],
      destination: {
        provinceId: "12",
        provinceName: "JAWA TENGAH",
        cityId: "591",
        cityName: "BANYUMAS",
        districtId: "6132",
        districtName: "PURWOKERTO SELATAN",
      },
      totalProductWeightGram: 240,
      packagingWeightGram: 0,
      totalWeightGram: 240,
    };
    const base = getQuotePayloadHash(basePayload);
    const differentDestination = getQuotePayloadHash({
      ...basePayload,
      destination: {
        ...basePayload.destination,
        districtId: "6133",
      },
    });
    const differentWeight = getQuotePayloadHash({
      ...basePayload,
      totalProductWeightGram: 480,
      totalWeightGram: 480,
    });

    assert.notEqual(base, differentDestination);
    assert.notEqual(base, differentWeight);
  });
});
