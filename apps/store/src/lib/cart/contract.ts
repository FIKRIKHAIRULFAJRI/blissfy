import type { CartItem, ValidatedCartItem } from "@/lib/cart/types";

export const CART_STORAGE_VERSION = 2;

const fallbackImage = "/products/placeholder-ivory.svg";

export type CartValidationPayload = {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    normalPrice?: number;
    salePrice?: number;
    stock?: number;
  }>;
};

export function buildCartValidationPayload(items: CartItem[]) {
  return {
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      normalPrice: item.normalPrice,
      salePrice: item.salePrice,
      stock: item.stock,
    })),
  } satisfies CartValidationPayload;
}

export function mergeCartItem(items: CartItem[], incoming: CartItem) {
  const canonicalIncoming = normalizeCartItem(incoming);
  const existing = items.find(
    (cartItem) => cartItem.variantId === canonicalIncoming.variantId,
  );

  if (!existing) {
    return [
      ...items,
      {
        ...canonicalIncoming,
        quantity: clampQuantity(
          canonicalIncoming.quantity,
          canonicalIncoming.stock,
        ),
      },
    ];
  }

  return items.map((cartItem) =>
    cartItem.variantId === canonicalIncoming.variantId
      ? {
          ...cartItem,
          ...canonicalIncoming,
          quantity: clampQuantity(
            cartItem.quantity + canonicalIncoming.quantity,
            canonicalIncoming.stock,
          ),
        }
      : cartItem,
  );
}

export function updateCartItemQuantity(
  items: CartItem[],
  variantId: string,
  quantity: number,
) {
  return items.map((item) =>
    item.variantId === variantId
      ? { ...item, quantity: clampQuantity(quantity, item.stock) }
      : item,
  );
}

export function syncValidatedCartItems(
  items: CartItem[],
  validatedItems: ValidatedCartItem[],
) {
  const latestByVariant = new Map(
    validatedItems.map((item) => [item.variantId, item]),
  );
  let changed = false;

  const nextItems = items.map((item) => {
    const latest = latestByVariant.get(item.variantId);

    if (!latest) {
      return item;
    }

    const nextItem = normalizeCartItem({
      ...item,
      ...latest,
      quantity: clampQuantity(latest.quantity, latest.stock),
    });

    if (
      nextItem.quantity !== item.quantity ||
      nextItem.normalPrice !== item.normalPrice ||
      nextItem.salePrice !== item.salePrice ||
      nextItem.stock !== item.stock ||
      nextItem.weightGram !== item.weightGram ||
      nextItem.discountLabel !== item.discountLabel
    ) {
      changed = true;
    }

    return nextItem;
  });

  return changed ? nextItems : items;
}

export function migrateCartItems(value: unknown): CartItem[] {
  const maybeState =
    value && typeof value === "object" && "items" in value
      ? (value as { items?: unknown }).items
      : value;

  if (!Array.isArray(maybeState)) {
    return [];
  }

  return maybeState.map((item) => normalizeCartItem(item));
}

export function normalizeCartItem(item: unknown): CartItem {
  const record =
    item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    productId: readString(record.productId),
    variantId: readString(record.variantId),
    slug: readString(record.slug),
    name: readString(record.name) || "Item keranjang lama",
    imageUrl: readString(record.imageUrl) || fallbackImage,
    imageAlt: readString(record.imageAlt) || "Produk Blissfy.co",
    colorName: readString(record.colorName) || "Warna tidak tersedia",
    colorHex: readNullableString(record.colorHex),
    size: readString(record.size) || "Ukuran tidak tersedia",
    quantity: readPositiveInteger(record.quantity, 1),
    normalPrice: readNonNegativeInteger(record.normalPrice, 0),
    salePrice: readNonNegativeInteger(record.salePrice, 0),
    discountLabel: readNullableString(record.discountLabel),
    weightGram: readNonNegativeInteger(record.weightGram, 0),
    stock: readNonNegativeInteger(record.stock, 0),
  };
}

export function clampQuantity(quantity: number, stock: number) {
  return Math.max(1, Math.min(quantity, Math.max(1, stock)));
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readPositiveInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

function readNonNegativeInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}
