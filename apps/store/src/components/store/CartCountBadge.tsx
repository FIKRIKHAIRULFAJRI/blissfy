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

  return (
    <span
      aria-label={`${count} item di keranjang`}
      className="grid size-5 place-items-center rounded-full bg-ink text-[11px] text-surface"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
