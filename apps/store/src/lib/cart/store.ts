"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CART_STORAGE_VERSION,
  mergeCartItem,
  migrateCartItems,
  migrateSelectedVariantIds,
  syncValidatedCartItems,
  updateCartItemQuantity,
} from "@/lib/cart/contract";
import type { CartItem, ValidatedCartItem } from "@/lib/cart/types";

type CartState = {
  items: CartItem[];
  selectedVariantIds: string[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  removeItems: (variantIds: string[]) => void;
  toggleItemSelection: (variantId: string) => void;
  clearCart: () => void;
  syncValidatedItems: (items: ValidatedCartItem[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      selectedVariantIds: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addItem: (item) =>
        set((state) => {
          const items = mergeCartItem(state.items, item);
          const selectedVariantIds = item.variantId
            ? Array.from(
                new Set([...state.selectedVariantIds, item.variantId]),
              )
            : state.selectedVariantIds;

          return { items, selectedVariantIds };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: updateCartItemQuantity(state.items, variantId, quantity),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
          selectedVariantIds: state.selectedVariantIds.filter(
            (selectedVariantId) => selectedVariantId !== variantId,
          ),
        })),
      removeItems: (variantIds) =>
        set((state) => {
          const removedVariantIds = new Set(variantIds);

          return {
            items: state.items.filter(
              (item) => !removedVariantIds.has(item.variantId),
            ),
            selectedVariantIds: state.selectedVariantIds.filter(
              (variantId) => !removedVariantIds.has(variantId),
            ),
          };
        }),
      toggleItemSelection: (variantId) =>
        set((state) => ({
          selectedVariantIds: state.selectedVariantIds.includes(variantId)
            ? state.selectedVariantIds.filter(
                (selectedVariantId) => selectedVariantId !== variantId,
              )
            : [...state.selectedVariantIds, variantId],
        })),
      clearCart: () => set({ items: [], selectedVariantIds: [] }),
      syncValidatedItems: (validatedItems) =>
        set((state) => {
          const nextItems = syncValidatedCartItems(state.items, validatedItems);
          return nextItems === state.items ? state : { items: nextItems };
        }),
    }),
    {
      name: "blissfy-cart-v1",
      version: CART_STORAGE_VERSION,
      migrate: (persistedState) => {
        const items = migrateCartItems(persistedState);

        return {
          items,
          selectedVariantIds: migrateSelectedVariantIds(
            persistedState,
            items,
          ),
          hydrated: false,
        };
      },
      merge: (persistedState, currentState) => {
        const items = migrateCartItems(persistedState);

        return {
          ...currentState,
          items,
          selectedVariantIds: migrateSelectedVariantIds(
            persistedState,
            items,
          ),
        };
      },
      partialize: (state) => ({
        items: state.items,
        selectedVariantIds: state.selectedVariantIds,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

let hydrationStarted = false;

export function ensureCartHydration() {
  if (hydrationStarted) {
    return;
  }

  hydrationStarted = true;
  void useCartStore.persist.rehydrate();
}

export function getCartTotals(items: CartItem[]) {
  return items.reduce(
    (totals, item) => {
      totals.grossSubtotal += item.normalPrice * item.quantity;
      totals.discountTotal +=
        Math.max(0, item.normalPrice - item.salePrice) * item.quantity;
      totals.netSubtotal += item.salePrice * item.quantity;
      totals.totalItems += item.quantity;
      totals.totalWeightGram += item.weightGram * item.quantity;
      return totals;
    },
    {
      grossSubtotal: 0,
      discountTotal: 0,
      netSubtotal: 0,
      totalItems: 0,
      totalWeightGram: 0,
    },
  );
}
