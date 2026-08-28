"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { StoreButton } from "@/components/store/ui/StoreButton";
import { StoreFieldMessage } from "@/components/store/ui/StoreFieldMessage";
import { ensureCartHydration, useCartStore } from "@/lib/cart/store";
import { formatRupiah } from "@/lib/pricing";
import type { ProductDetail } from "@/lib/products";
import { cn } from "@/lib/utils";

type ProductPurchaseFormProps = {
  product: ProductDetail;
};

export function ProductPurchaseForm({ product }: ProductPurchaseFormProps) {
  const addItem = useCartStore((state) => state.addItem);
  const hydrated = useCartStore((state) => state.hydrated);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCartHydration();
  }, []);

  const colors = useMemo(() => {
    const colorMap = new Map<string, string | null>();

    for (const variant of product.variants) {
      if (!colorMap.has(variant.colorName)) {
        colorMap.set(variant.colorName, variant.colorHex);
      }
    }

    return Array.from(colorMap, ([name, value]) => ({ name, value }));
  }, [product.variants]);

  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((variant) => variant.size))),
    [product.variants],
  );

  const selectedVariant = product.variants.find(
    (variant) =>
      variant.colorName === selectedColor && variant.size === selectedSize,
  );
  const selectedVariantAvailable =
    Boolean(selectedVariant?.isActive) && (selectedVariant?.stock ?? 0) > 0;
  const maxQuantity = selectedVariantAvailable ? selectedVariant!.stock : 1;

  function hasAvailableColor(colorName: string) {
    return product.variants.some(
      (variant) =>
        variant.colorName === colorName && variant.isActive && variant.stock > 0,
    );
  }

  function hasAvailableSize(size: string) {
    return product.variants.some(
      (variant) =>
        variant.size === size &&
        (!selectedColor || variant.colorName === selectedColor) &&
        variant.isActive &&
        variant.stock > 0,
    );
  }

  function handleColorSelect(colorName: string) {
    setSelectedColor(colorName);
    setError(null);
    setMessage(null);

    if (
      selectedSize &&
      !product.variants.some(
        (variant) =>
          variant.colorName === colorName &&
          variant.size === selectedSize &&
          variant.isActive &&
          variant.stock > 0,
      )
    ) {
      setSelectedSize("");
    }
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setError(null);
    setMessage(null);
  }

  function handleAddToCart() {
    if (!selectedColor || !selectedSize) {
      setError("Pilih warna dan ukuran sebelum menambahkan ke keranjang.");
      return;
    }

    if (!selectedVariant || !selectedVariantAvailable) {
      setError("Varian ini tidak tersedia untuk dibeli.");
      return;
    }

    if (!product.id || !selectedVariant.id) {
      setError(
        "Data produk belum lengkap. Muat ulang halaman lalu pilih varian lagi.",
      );
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.primaryImage.url,
      imageAlt: product.primaryImage.altText,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      size: selectedVariant.size,
      quantity,
      normalPrice: product.normalPrice,
      salePrice: product.salePrice,
      discountLabel: product.discountLabel,
      weightGram: selectedVariant.weightGram,
      stock: selectedVariant.stock,
    });
    setError(null);
    setMessage("Produk ditambahkan ke keranjang.");
  }

  return (
    <section className="md:pt-[var(--space-4)] lg:sticky lg:top-28 lg:self-start">
      <p className="text-label uppercase text-[var(--color-text-muted)]">
        {product.categoryName}
      </p>
      <h1 className="text-display mt-[var(--space-3)] text-[var(--color-text-primary)]">
        {product.name}
      </h1>

      <div className="mt-[var(--space-4)] flex flex-wrap items-baseline gap-[var(--space-3)]">
        <p className="text-body-lg font-medium text-[var(--color-text-primary)]">
          {formatRupiah(product.salePrice)}
        </p>
        {product.salePrice < product.normalPrice ? (
          <>
            <p className="text-sm font-medium text-[var(--color-text-muted)] line-through">
              {formatRupiah(product.normalPrice)}
            </p>
            {product.discountLabel ? (
              <p className="text-label uppercase text-[var(--color-text-muted)]">
                {product.discountLabel}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-[var(--space-5)] space-y-[var(--space-5)]">
        <fieldset>
          <legend className="text-label uppercase text-[var(--color-text-secondary)]">
            Warna: {selectedColor || "Pilih warna"}
          </legend>
          <div className="mt-[var(--space-3)] flex flex-wrap gap-[var(--space-3)]">
            {colors.map((color) => {
              const disabled = !hasAvailableColor(color.name);
              const selected = selectedColor === color.name;

              return (
                <button
                  aria-label={`${color.name}${disabled ? " tidak tersedia" : ""}`}
                  aria-pressed={selected}
                  className={cn(
                    "relative grid size-11 place-items-center rounded-full transition-[opacity,box-shadow]",
                    selected
                      ? "ring-1 ring-[var(--color-text-brand)] ring-offset-4 ring-offset-[var(--color-canvas)]"
                      : "hover:ring-1 hover:ring-[var(--color-border-strong)] hover:ring-offset-2 hover:ring-offset-[var(--color-canvas)]",
                    disabled &&
                      "opacity-45 after:absolute after:left-2 after:right-2 after:top-1/2 after:h-px after:-rotate-45 after:bg-[var(--color-text-muted)]",
                  )}
                  disabled={disabled}
                  key={color.name}
                  onClick={() => handleColorSelect(color.name)}
                  type="button"
                >
                  <span
                    aria-hidden
                    className="size-8 rounded-full border border-[var(--color-border-strong)]"
                    style={{
                      backgroundColor: color.value ?? "var(--color-surface)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-label uppercase text-[var(--color-text-secondary)]">
            Ukuran
          </legend>
          <div className="mt-[var(--space-3)] grid grid-cols-3 gap-[var(--space-3)] sm:grid-cols-5">
            {sizes.map((size) => {
              const disabled = !hasAvailableSize(size);
              const selected = selectedSize === size;

              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "relative grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-sm)] border px-[var(--space-2)] text-sm font-medium transition-colors",
                    selected
                      ? "border-[var(--color-text-brand)] bg-[var(--color-text-brand)] text-[var(--color-action-primary-text)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]",
                    disabled &&
                      "border-[var(--color-border)] bg-[var(--color-surface-container)] text-[var(--color-text-muted)] after:absolute after:left-3 after:right-3 after:top-1/2 after:h-px after:-rotate-12 after:bg-[var(--color-text-muted)]",
                  )}
                  disabled={disabled}
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  type="button"
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-end justify-between gap-[var(--space-4)]">
          <div>
            <p className="text-label uppercase text-[var(--color-text-secondary)]">
              {selectedVariantAvailable ? "Stok tersedia" : "Ketersediaan"}
            </p>
            <p className="mt-[var(--space-2)] text-sm text-[var(--color-text-muted)]">
              {selectedVariantAvailable
                ? `${selectedVariant!.stock} item`
                : selectedColor && selectedSize
                  ? "Varian ini sedang tidak tersedia."
                  : "Pilih warna dan ukuran untuk melihat stok."}
            </p>
          </div>
          <div className="shrink-0">
            <label
              className="text-label block text-right uppercase text-[var(--color-text-secondary)]"
              htmlFor="product-quantity"
            >
              Jumlah
            </label>
            <div className="mt-[var(--space-2)]">
              <QuantityStepper
                disabled={!selectedVariantAvailable}
                id="product-quantity"
                max={maxQuantity}
                onChange={(value) => setQuantity(value)}
                value={Math.min(quantity, maxQuantity)}
              />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <StoreFieldMessage
          className="mt-[var(--space-4)] block rounded-[var(--radius-default)] bg-[var(--color-error-surface)] p-[var(--space-3)]"
          role="alert"
          variant="error"
        >
            {error}
        </StoreFieldMessage>
      ) : null}
      {message ? (
        <div
          className="mt-[var(--space-4)] rounded-[var(--radius-default)] bg-[var(--color-surface-container)] p-[var(--space-3)] text-sm font-medium text-[var(--color-text-secondary)]"
          role="status"
        >
          {message}{" "}
          <Link className="underline underline-offset-4" href="/cart">
            Lihat keranjang
          </Link>
        </div>
      ) : null}

      <StoreButton
        className="mt-[var(--space-5)] w-full !rounded-[var(--radius-sm)] uppercase tracking-[0.05em]"
        disabled={!hydrated || !selectedVariantAvailable}
        onClick={handleAddToCart}
        size="large"
        type="button"
      >
        {!hydrated ? "Menyiapkan keranjang..." : "Tambah ke keranjang"}
      </StoreButton>

      <div className="mt-[var(--space-5)] border-b border-[var(--color-border)]">
        <ProductAccordion title="Detail produk">
          <p>{product.description}</p>
        </ProductAccordion>
        <ProductAccordion title="Informasi pengiriman">
          <p>
            {selectedVariant
              ? `Berat varian ${selectedVariant.colorName}, ukuran ${selectedVariant.size}, adalah ${selectedVariant.weightGram} gram per item. `
              : "Pilih warna dan ukuran untuk melihat berat varian. "}
            Berat digunakan untuk perhitungan ongkir pada tahap pengiriman.
          </p>
        </ProductAccordion>
      </div>
    </section>
  );
}

function ProductAccordion({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <details className="group border-t border-[var(--color-border)]">
      <summary className="text-body flex cursor-pointer list-none items-center justify-between gap-[var(--space-3)] py-[var(--space-3)] font-medium text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          aria-hidden
          className="size-5 shrink-0 transition-transform duration-[var(--duration-default)] group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </summary>
      <div className="text-body pb-[var(--space-4)] pr-[var(--space-5)] text-[var(--color-text-secondary)]">
        {children}
      </div>
    </details>
  );
}
