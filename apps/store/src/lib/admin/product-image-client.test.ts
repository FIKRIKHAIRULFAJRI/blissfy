import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,
  moveProductImage,
  validateProductImageSelection,
} from "./product-image-client";

test("accepts multiple supported Admin product images", () => {
  assert.equal(
    validateProductImageSelection({
      currentImageCount: 1,
      files: [
        { size: 1_000_000, type: "image/jpeg" },
        { size: 2_000_000, type: "image/webp" },
      ],
    }),
    null,
  );
});

test("rejects unsafe image types, oversized images, and count overflow", () => {
  assert.match(
    validateProductImageSelection({
      currentImageCount: 0,
      files: [{ size: 100, type: "image/svg+xml" }],
    }) ?? "",
    /JPEG, PNG, atau WebP/,
  );
  assert.match(
    validateProductImageSelection({
      currentImageCount: 0,
      files: [
        {
          size: ADMIN_PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES + 1,
          type: "image/png",
        },
      ],
    }) ?? "",
    /10 MiB/,
  );
  assert.match(
    validateProductImageSelection({
      currentImageCount: 8,
      files: [{ size: 100, type: "image/png" }],
    }) ?? "",
    /Maksimum 8/,
  );
});

test("creates a deterministic accessible move-up or move-down order", () => {
  assert.deepEqual(moveProductImage(["one", "two", "three"], 1, -1), [
    "two",
    "one",
    "three",
  ]);
  assert.deepEqual(moveProductImage(["one", "two", "three"], 1, 1), [
    "one",
    "three",
    "two",
  ]);
  assert.equal(moveProductImage(["one"], 0, -1), null);
});
