"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CART_STORAGE_VERSION,
  mergeCartItem,
  migrateCartItems,
  syncValidatedCartItems,
  updateCartItemQuantity,
} from "@/lib/cart/contract";
import type { CartItem, ValidatedCartItem } from "@/lib/cart/types";

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  syncValidatedItems: (items: ValidatedCartItem[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addItem: (item) =>
        set((state) => ({
          items: mergeCartItem(state.items, item),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: updateCartItemQuantity(state.items, variantId, quantity),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      clearCart: () => set({ items: [] }),
      syncValidatedItems: (validatedItems) =>
        set((state) => {
          const nextItems = syncValidatedCartItems(state.items, validatedItems);
          return nextItems === state.items ? state : { items: nextItems };
        }),
    }),
    {
      name: "blissfy-cart-v1",
      version: CART_STORAGE_VERSION,
      migrate: (persistedState) => ({
        items: migrateCartItems(persistedState),
        hydrated: false,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        items: migrateCartItems(persistedState),
      }),
      partialize: (state) => ({ items: state.items }),
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
