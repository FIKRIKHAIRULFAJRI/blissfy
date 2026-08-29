"use client";

import { useEffect } from "react";
import { ensureCartHydration, useCartStore } from "@/lib/cart/store";

export function CartCountBadge() {
  const hydrated = useCartStore((state) => state.hydrated);
  const totalItems = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  useEffect(() => {
    ensureCartHydration();
  }, []);

  const count = hydrated ? totalItems : 0;

  if (count === 0) {
    return null;
  }

  return (
    <span
      aria-label={`${count} item di keranjang`}
      className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-text-brand)] px-1 text-[9px] font-semibold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
