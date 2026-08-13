"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  CartValidationResponse,
  InvalidCartItem,
} from "@/lib/cart/types";
import { buildCartValidationPayload } from "@/lib/cart/contract";
import {
  ensureCartHydration,
  getCartTotals,
  useCartStore,
} from "@/lib/cart/store";
import { formatRupiah } from "@/lib/pricing";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/store/QuantityStepper";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const syncValidatedItems = useCartStore((state) => state.syncValidatedItems);
  const [validation, setValidation] = useState<CartValidationResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function revalidateCart() {
    if (!hydrated || items.length === 0) {
      return;
    }

    startTransition(() => {
      validateCartItems(items)
        .then((result) => {
          setValidation(result);
          setError(null);
          syncValidatedItems(result.items);
        })
        .catch((validationError: unknown) => {
          setError(
            validationError instanceof Error
              ? validationError.message
              : "Keranjang belum dapat divalidasi.",
          );
        });
    });
  }

  useEffect(() => {
    ensureCartHydration();
  }, []);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      return;
    }

    const controller = new AbortController();

    startTransition(() => {
      validateCartItems(items, controller.signal)
        .then((result) => {
          setValidation(result);
          setError(null);
          syncValidatedItems(result.items);
        })
        .catch((validationError: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          setError(
            validationError instanceof Error
              ? validationError.message
              : "Keranjang belum dapat divalidasi.",
          );
        });
    });

    return () => controller.abort();
  }, [hydrated, items, syncValidatedItems]);

  const localTotals = useMemo(() => getCartTotals(items), [items]);
  const summary = validation?.summary ?? {
    ...localTotals,
    allValid: false,
  };
  const validationMatchesItems =
    validation?.items.length === items.length &&
    items.every((item) =>
      validation.items.some(
        (validatedItem) =>
          validatedItem.variantId === item.variantId &&
          validatedItem.quantity === item.quantity,
      ),
    );
  const invalidByVariant = useMemo(() => {
    const map = new Map<string, InvalidCartItem>();

    for (const item of validation?.invalidItems ?? []) {
      map.set(item.variantId, item);
    }

    return map;
  }, [validation]);
  const checkoutDisabled =
    !hydrated ||
    items.length === 0 ||
    Boolean(error) ||
    isPending ||
    !validationMatchesItems ||
    !validation?.summary.allValid;

  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center md:p-12">
        <h1 className="text-3xl font-semibold text-ink">
          Keranjangmu masih kosong
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-soft">
          Temukan sesuatu yang cocok untukmu, lalu pilih warna dan ukuran
          sebelum masuk ke checkout.
        </p>
        <Link className={buttonClasses({ className: "mt-6" })} href="/products">
          Lihat katalog
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4" aria-label="Item keranjang">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-ink md:text-4xl">
              Keranjang
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Harga dan stok divalidasi ulang dari database sebelum checkout.
            </p>
          </div>
          <button
            className="min-h-11 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger-bg"
            onClick={clearCart}
            type="button"
          >
            Kosongkan
          </button>
        </div>

        {error ? (
          <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-bg p-4 text-sm font-medium text-danger">
            <p>{error}</p>
            <button
              className="mt-3 min-h-10 rounded-full border border-danger px-4 text-sm font-semibold text-danger hover:bg-surface"
              disabled={isPending}
              onClick={revalidateCart}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        {validation?.notices.length ? (
          <div className="space-y-2 rounded-[var(--radius-lg)] bg-warning-bg p-4 text-sm font-medium text-warning">
            {validation.notices.map((notice, index) => (
              <p key={`${notice.variantId}-${notice.type}-${index}`}>
                {notice.message}
              </p>
            ))}
          </div>
        ) : null}

        {items.map((item, index) => {
          const itemKey = item.variantId || `stale-item-${index}`;
          const invalidItem =
            invalidByVariant.get(item.variantId) ?? invalidByVariant.get(itemKey);
          const lineDiscount =
            Math.max(
              0,
              (item.normalPrice ?? 0) - (item.salePrice ?? 0),
            ) * (item.quantity ?? 1);
          const productHref = item.slug ? `/products/${item.slug}` : "/products";

          return (
            <article
              className="grid gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-4 sm:grid-cols-[120px_1fr] md:p-5"
              key={itemKey}
            >
              <Link
                className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted"
                href={productHref}
              >
                <Image
                  alt={item.imageAlt ?? item.name ?? "Produk Blissfy.co"}
                  className="object-cover"
                  fill
                  sizes="120px"
                  src={item.imageUrl ?? "/products/placeholder-ivory.svg"}
                />
              </Link>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="text-lg font-semibold text-ink hover:text-olive"
                      href={productHref}
                    >
                      {item.name ?? "Item keranjang lama"}
                    </Link>
                    {invalidItem ? (
                      <Badge tone="warning">Tidak tersedia</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink-muted">
                    {item.colorName ?? "Warna tidak tersedia"} /{" "}
                    {item.size ?? "Ukuran tidak tersedia"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-ink">
                      {formatRupiah(item.salePrice ?? 0)}
                    </p>
                    {(item.salePrice ?? 0) < (item.normalPrice ?? 0) ? (
                      <>
                        <p className="text-sm font-medium text-ink-muted line-through">
                          {formatRupiah(item.normalPrice ?? 0)}
                        </p>
                        {item.discountLabel ? (
                          <Badge tone="warning">{item.discountLabel}</Badge>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  {lineDiscount > 0 ? (
                    <p className="mt-2 text-sm font-semibold text-success">
                      Hemat {formatRupiah(lineDiscount)}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-ink-muted">
                    Stok diketahui {item.stock ?? 0}. Berat{" "}
                    {item.weightGram ?? 0} gram.
                  </p>
                  {invalidItem ? (
                    <p className="mt-3 rounded-[var(--radius-md)] bg-danger-bg p-3 text-sm font-medium text-danger">
                      {invalidItem.reason}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <QuantityStepper
                    disabled={Boolean(invalidItem)}
                    max={item.stock ?? 1}
                    onChange={(quantity) =>
                      updateQuantity(item.variantId, quantity)
                    }
                    value={item.quantity ?? 1}
                  />
                  <p className="text-base font-semibold text-ink">
                    {formatRupiah((item.salePrice ?? 0) * (item.quantity ?? 1))}
                  </p>
                  <button
                    className="min-h-10 rounded-full text-sm font-semibold text-danger hover:underline"
                    onClick={() => removeItem(item.variantId)}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <aside className="h-fit rounded-[var(--radius-xl)] border border-border bg-surface p-5 lg:sticky lg:top-28">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">Ringkasan</h2>
          {isPending ? <Badge tone="info">Memvalidasi</Badge> : null}
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <SummaryRow label="Total item" value={`${summary.totalItems} item`} />
          <SummaryRow
            label="Subtotal kotor"
            value={formatRupiah(summary.grossSubtotal)}
          />
          <SummaryRow
            label="Diskon produk"
            value={`-${formatRupiah(summary.discountTotal)}`}
          />
          <SummaryRow label="Ongkos kirim" value="Dihitung saat checkout" />
          <div className="border-t border-border pt-4">
            <SummaryRow
              label="Subtotal sementara"
              strong
              value={formatRupiah(summary.netSubtotal)}
            />
          </div>
        </dl>
        {!validation?.summary.allValid ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-warning-bg p-3 text-sm leading-6 text-warning">
            Checkout hanya bisa dilanjutkan setelah semua item valid dan stok
            tersedia.
          </p>
        ) : null}
        <Link
          aria-disabled={checkoutDisabled}
          className={buttonClasses({
            className: checkoutDisabled
              ? "mt-5 w-full pointer-events-none bg-surface-muted text-ink-muted"
              : "mt-5 w-full",
            size: "large",
          })}
          href="/checkout"
        >
          Lanjut ke checkout
        </Link>
      </aside>
    </div>
  );
}

async function validateCartItems(
  items: ReturnType<typeof useCartStore.getState>["items"],
  signal?: AbortSignal,
) {
  const response = await fetch("/api/cart/validate", {
    body: JSON.stringify(buildCartValidationPayload(items)),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(
      errorBody?.message ?? "Keranjang belum dapat divalidasi. Coba lagi.",
    );
  }

  return (await response.json()) as CartValidationResponse;
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-center justify-between gap-4 text-base font-semibold text-ink"
          : "flex items-center justify-between gap-4 text-ink-soft"
      }
    >
      <dt>{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        {[0, 1].map((item) => (
          <div
            className="h-44 animate-pulse rounded-[var(--radius-xl)] bg-surface-muted"
            key={item}
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[var(--radius-xl)] bg-surface-muted" />
    </div>
  );
}
