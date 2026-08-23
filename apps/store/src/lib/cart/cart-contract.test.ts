import assert from "node:assert/strict";
import test from "node:test";
import { cartValidationItemSchema } from "@/lib/cart/schemas";
import {
  buildCartValidationPayload,
  migrateCartItems,
} from "@/lib/cart/contract";
import { useCartStore } from "@/lib/cart/store";
import type { CartItem } from "@/lib/cart/types";

const productId = "cmsq7qej3000igoun85on2rtn";
const variantId = "cmsq7qf5y000ngoungwj1j19v";

const sampleItem: CartItem = {
  productId,
  variantId,
  slug: "soft-utility-outer",
  name: "Soft Utility Outer",
  imageUrl: "/products/placeholder-olive.svg",
  imageAlt: "Soft Utility Outer",
  colorName: "Olive",
  colorHex: "#6F7254",
  size: "M",
  quantity: 1,
  normalPrice: 289000,
  salePrice: 260000,
  discountLabel: "-10%",
  weightGram: 450,
  stock: 5,
};

test("addItem produces canonical validation payload", () => {
  useCartStore.setState({ items: [], hydrated: true });
  useCartStore.getState().addItem(sampleItem);

  const [payloadItem] = buildCartValidationPayload(
    useCartStore.getState().items,
  ).items;

  assert.deepEqual(
    {
      productId: payloadItem.productId,
      variantId: payloadItem.variantId,
      quantity: payloadItem.quantity,
    },
    {
      productId,
      variantId,
      quantity: 1,
    },
  );
  assert.equal(cartValidationItemSchema.safeParse(payloadItem).success, true);
});

test("persisted cart can reload and validate with the same contract", () => {
  const [reloadedItem] = migrateCartItems({ items: [sampleItem] });
  const [payloadItem] = buildCartValidationPayload([reloadedItem]).items;

  assert.equal(payloadItem.productId, productId);
  assert.equal(payloadItem.variantId, variantId);
  assert.equal(payloadItem.quantity, 1);
  assert.equal(cartValidationItemSchema.safeParse(payloadItem).success, true);
});

test("legacy item without variantId is deterministic stale data", () => {
  const [legacyItem] = migrateCartItems({
    items: [{ name: "Legacy item", quantity: 1 }],
  });
  const [payloadItem] = buildCartValidationPayload([legacyItem]).items;

  assert.equal(payloadItem.productId, "");
  assert.equal(payloadItem.variantId, "");
  assert.equal(payloadItem.quantity, 1);
  assert.equal(cartValidationItemSchema.safeParse(payloadItem).success, false);
});
