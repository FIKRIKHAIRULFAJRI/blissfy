"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { QuantityStepper } from "@/components/store/QuantityStepper";
import { StoreCheckbox } from "@/components/store/ui/StoreCheckbox";
import { storeButtonClasses } from "@/components/store/ui/StoreButton";
import { buildCartValidationPayload } from "@/lib/cart/contract";
import {
  ensureCartHydration,
  getCartTotals,
  useCartStore,
} from "@/lib/cart/store";
import type {
  CartValidationResponse,
  InvalidCartItem,
} from "@/lib/cart/types";
import { formatRupiah } from "@/lib/pricing";
import { getPublicApiUrl } from "@/lib/public-api";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const selectedVariantIds = useCartStore(
    (state) => state.selectedVariantIds,
  );
  const toggleItemSelection = useCartStore(
    (state) => state.toggleItemSelection,
  );
  const syncValidatedItems = useCartStore((state) => state.syncValidatedItems);

  const [validation, setValidation] =
    useState<CartValidationResponse | null>(null);

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

  const selectedItems = useMemo(
    () =>
      items.filter((item) => selectedVariantIds.includes(item.variantId)),
    [items, selectedVariantIds],
  );

  const localTotals = useMemo(
    () => getCartTotals(selectedItems),
    [selectedItems],
  );

  const summary = localTotals;

  const validationMatchesSelectedItems =
    validation !== null &&
    selectedItems.length > 0 &&
    selectedItems.every((item) =>
      validation.items.some(
        (validatedItem) =>
          validatedItem.variantId === item.variantId &&
          validatedItem.quantity === item.quantity,
      ),
    ) &&
    !validation?.invalidItems.some((invalidItem) =>
      selectedVariantIds.includes(invalidItem.variantId),
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
    selectedItems.length === 0 ||
    Boolean(error) ||
    isPending ||
    !validationMatchesSelectedItems;

  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[1200px] rounded-[12px] border border-black/10 bg-paper-white p-8 text-center sm:p-14">
        <h1 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-black sm:text-4xl">
          Your bag is empty
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-[1.6] text-stone">
          Discover pieces made for everyday ease, then choose your preferred
          color and size.
        </p>

        <Link
          className={storeButtonClasses({
            className:
              "mt-8 rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] px-8 uppercase tracking-[0.08em] text-white hover:bg-black focus-visible:outline-black",
            size: "large",
          })}
          href="/products"
        >
          Continue Shopping
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <header>
        <h1 className="font-goudy-old-style text-[44px] font-normal leading-none tracking-[-0.02em] text-black sm:text-[52px]">
          Your Bag
        </h1>
      </header>

      {error ? (
        <div className="mt-8 flex flex-col gap-4 rounded-[8px] border border-black/15 bg-paper-white p-5 text-sm leading-[1.6] text-[var(--color-error)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-4">
            <InfoIcon />
            <p>{error}</p>
          </div>

          <button
            className="min-h-11 shrink-0 border border-[var(--color-error)] px-5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-[var(--color-error-surface)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={revalidateCart}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {validation?.notices.length ? (
        <div
          className="mt-8 flex items-start gap-4 rounded-[8px] border border-black/15 bg-paper-white p-5 text-sm leading-[1.6] text-stone sm:items-center sm:px-6"
          role="status"
        >
          <InfoIcon />
          <p>
            Some items in your bag have changed. Please review the updates
            before continuing to checkout.
          </p>
          <ul className="sr-only">
            {validation.notices.map((notice, index) => (
              <li key={`${notice.variantId}-${notice.type}-${index}`}>
                {notice.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <section aria-label="Cart items">

          <div className="space-y-4">
            {items.map((item, index) => {
              const itemKey = item.variantId || `stale-item-${index}`;

              const invalidItem =
                invalidByVariant.get(item.variantId) ??
                invalidByVariant.get(itemKey);

              const productHref = item.slug
                ? `/products/${item.slug}`
                : "/products";

              return (
                <article
                  className="relative grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-[10px] border border-black/[0.06] bg-paper-white p-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6 sm:p-6"
                  key={itemKey}
                >
                  <Link
                    className="relative aspect-square overflow-hidden rounded-[8px] bg-black/[0.05]"
                    href={productHref}
                  >
                    <Image
                      alt={item.imageAlt ?? item.name ?? "Produk Blissfy.co"}
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 96px, 150px"
                      src={
                        item.imageUrl ?? "/products/placeholder-ivory.svg"
                      }
                    />
                  </Link>

                  <div className="relative flex min-w-0 flex-col">
                    <div className="absolute -right-1 -top-2 flex items-center gap-1">
                      <button
                        aria-label={`Remove ${item.name ?? "item"} from cart`}
                        className="grid size-10 place-items-center rounded-[5px] text-stone transition-colors hover:bg-bone hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        onClick={() => removeItem(item.variantId)}
                        type="button"
                      >
                        <TrashIcon />
                      </button>

                      <label className="grid size-10 cursor-pointer place-items-center rounded-[5px] transition-colors hover:bg-bone">
                        <span className="sr-only">
                          Select {item.name ?? "item"} for checkout
                        </span>
                        <StoreCheckbox
                          aria-label={`Select ${item.name ?? "item"} for checkout`}
                          checked={selectedVariantIds.includes(item.variantId)}
                          disabled={!item.variantId}
                          onChange={() => toggleItemSelection(item.variantId)}
                        />
                      </label>
                    </div>

                    <div className="min-w-0 pt-10 sm:pr-24 sm:pt-0">
                      <Link
                        className="text-base font-semibold leading-tight text-black transition-opacity hover:opacity-60 focus-visible:outline-black sm:text-xl"
                        href={productHref}
                      >
                        {item.name ?? "Legacy cart item"}
                      </Link>

                      <p className="mt-2 text-sm leading-[1.5] text-stone sm:text-base">
                        Color: {item.colorName ?? "Unavailable"} · Size:{" "}
                        {item.size ?? "Unavailable"}
                      </p>

                      {invalidItem ? (
                        <p className="mt-3 inline-flex rounded-[3px] border border-black/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-error)]">
                          Unavailable
                        </p>
                      ) : null}
                    </div>

                    {invalidItem ? (
                      <p className="mt-4 rounded-[5px] border border-black/10 bg-bone p-3 text-sm leading-[1.5] text-[var(--color-error)]">
                        {invalidItem.reason}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
                      <QuantityStepper
                        disabled={Boolean(invalidItem)}
                        max={item.stock ?? 1}
                        onChange={(quantity) =>
                          updateQuantity(item.variantId, quantity)
                        }
                        value={item.quantity ?? 1}
                      />

                      <p className="text-lg font-semibold text-black">
                        {formatRupiah(
                          (item.salePrice ?? 0) * (item.quantity ?? 1),
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-[10px] border border-black/[0.06] bg-paper-white p-6 sm:p-8 lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-goudy-old-style text-[30px] font-normal leading-none tracking-[-0.012em] text-black sm:text-[34px]">
              Order Summary
            </h2>

            {isPending ? (
              <span className="rounded-[3px] bg-bone px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-stone">
                Validating
              </span>
            ) : null}
          </div>

          <dl className="mt-8 space-y-5 text-base">
            <SummaryRow
              label="Subtotal"
              value={formatRupiah(summary.netSubtotal)}
            />
            <SummaryRow label="Shipping" value="Calculated at checkout" />

            <div className="border-t border-black/15 pt-7">
              <SummaryRow
                label="Total"
                strong
                value={formatRupiah(summary.netSubtotal)}
              />
            </div>
          </dl>

          {selectedItems.length === 0 ? (
            <p className="mt-5 border-t border-black/15 pt-5 text-sm leading-[1.5] text-stone">
              Select at least one item to continue to checkout.
            </p>
          ) : null}

          <Link
            aria-disabled={checkoutDisabled}
            className={storeButtonClasses({
              className:
                "mt-6 w-full rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] uppercase tracking-[0.08em] text-white hover:bg-black focus-visible:outline-black",
              size: "large",
            })}
            href="/checkout"
            tabIndex={checkoutDisabled ? -1 : undefined}
          >
            Proceed to Checkout
          </Link>

          <p className="mt-4 text-center text-sm text-stone/60">
            No account required
          </p>

          <div className="mt-7 flex items-center justify-between gap-4 border-t border-black/15 pt-6 text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
            <span>QRIS payment</span>
            <span className="text-right">JNE &amp; J&amp;T shipping</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

async function validateCartItems(
  items: ReturnType<
    typeof useCartStore.getState
  >["items"],
  signal?: AbortSignal,
) {
  const response = await fetch(
    getPublicApiUrl(
      "/v1/checkout/validate",
    ),
    {
      body: JSON.stringify(
        buildCartValidationPayload(items),
      ),
      headers: {
        "content-type":
          "application/json",
      },
      method: "POST",
      signal,
    },
  );

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(
      errorBody?.message ??
        "Keranjang belum dapat divalidasi. Coba lagi.",
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
          ? "flex items-center justify-between gap-4 text-lg font-semibold text-black"
          : "flex items-center justify-between gap-4 text-stone"
      }
    >
      <dt>{label}</dt>

      <dd className={strong ? "text-right font-medium" : "text-right text-black"}>
        {value}
      </dd>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      aria-hidden
      className="mt-0.5 size-5 shrink-0 text-stone"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 10.5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="7.5" fill="currentColor" r="1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 7h14M9 7V4.75h6V7m-8.5 0 .75 12.25h9.5L17.5 7M10 10.5v5.5m4-5.5v5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse motion-reduce:animate-none">
      <span className="sr-only">Loading cart</span>
      <div className="h-10 w-44 rounded-[5px] bg-black/[0.08]" />
      <div className="mt-8 h-20 rounded-[8px] border border-black/10 bg-paper-white" />

      <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="space-y-4">
          {[0, 1].map((item) => (
            <div
              className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-[10px] border border-black/[0.06] bg-paper-white p-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6 sm:p-6"
              key={item}
            >
              <div className="aspect-square rounded-[8px] bg-black/[0.07]" />
              <div>
                <div className="h-7 w-52 max-w-full rounded-[5px] bg-black/[0.08]" />
                <div className="mt-3 h-3 w-24 rounded-[5px] bg-black/[0.06]" />
                <div className="mt-5 h-5 w-32 rounded-[5px] bg-black/[0.08]" />
                <div className="mt-8 h-11 w-[132px] rounded-[5px] bg-black/[0.07]" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-[500px] rounded-[10px] border border-black/[0.06] bg-paper-white" />
      </div>
    </div>
  );
}
