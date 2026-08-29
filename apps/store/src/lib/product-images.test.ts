import assert from "node:assert/strict";
import test from "node:test";

import {
  getOrderedProductImages,
  getPrimaryProductImage,
  PRODUCT_IMAGE_FALLBACK_URL,
  type ProductImage,
} from "./product-images";

const images: ProductImage[] = [
  {
    id: "back",
    url: "/back.jpg",
    altText: "Product back view",
    sortOrder: 1,
    isPrimary: false,
  },
  {
    id: "front",
    url: "/front.jpg",
    altText: "Product front view",
    sortOrder: 0,
    isPrimary: true,
  },
];

test("orders the explicit primary first without mutating API input", () => {
  const input = [...images];
  const ordered = getOrderedProductImages(input);

  assert.deepEqual(
    ordered.map((image) => image.id),
    ["front", "back"],
  );
  assert.deepEqual(input, images);
});

test("uses the first deterministic sort order when no image is primary", () => {
  const primary = getPrimaryProductImage({
    id: "product-1",
    name: "Product",
    images: images.map((image) => ({ ...image, isPrimary: false })),
  });

  assert.equal(primary.id, "front");
});

test("uses the presentation fallback when the API returns zero images", () => {
  const primary = getPrimaryProductImage({
    id: "product-without-image",
    name: "Product Without Image",
    images: [],
  });

  assert.deepEqual(primary, {
    id: "fallback:product-without-image",
    url: PRODUCT_IMAGE_FALLBACK_URL,
    altText: "Product Without Image",
    sortOrder: 0,
    isPrimary: true,
  });
});
