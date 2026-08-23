"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/store/QuantityStepper";
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
  const saving = Math.max(0, product.normalPrice - product.salePrice);

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
    <section className="lg:sticky lg:top-28 lg:self-start">
      <p className="text-xs font-semibold uppercase leading-tight text-olive">
        {product.categoryName}
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
          {product.name}
        </h1>
        <Badge className="w-fit" tone={product.isAvailable ? "success" : "warning"}>
          {product.isAvailable ? "Ready stock" : "Stok habis"}
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="text-2xl font-semibold text-ink">
          {formatRupiah(product.salePrice)}
        </p>
        {product.salePrice < product.normalPrice ? (
          <>
            <p className="text-base font-medium text-ink-muted line-through">
              {formatRupiah(product.normalPrice)}
            </p>
            {product.discountLabel ? (
              <Badge tone="warning">{product.discountLabel}</Badge>
            ) : null}
            <p className="text-sm font-semibold text-success">
              Hemat {formatRupiah(saving)}
            </p>
          </>
        ) : null}
      </div>

      <p className="mt-6 text-base leading-8 text-ink-soft">
        {product.description}
      </p>

      <div className="mt-8 space-y-8 border-y border-border py-8">
        <div>
          <h2 className="text-sm font-semibold text-ink">Warna</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => {
              const disabled = !hasAvailableColor(color.name);
              const selected = selectedColor === color.name;

              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border bg-surface px-3 text-sm font-medium transition-colors",
                    selected
                      ? "border-ink text-ink"
                      : "border-border text-ink-soft hover:border-border-strong",
                    disabled && "border-border bg-surface-muted text-ink-muted",
                  )}
                  disabled={disabled}
                  key={color.name}
                  onClick={() => handleColorSelect(color.name)}
                  type="button"
                >
                  <span
                    aria-hidden
                    className="size-5 rounded-full border border-border-strong"
                    style={{ backgroundColor: color.value ?? "#FFFEFA" }}
                  />
                  {color.name}
                  {disabled ? " habis" : null}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink">Ukuran</h2>
            <Link
              className="text-sm font-semibold text-olive hover:text-ink"
              href="/products"
            >
              Panduan ukuran
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {sizes.map((size) => {
              const disabled = !hasAvailableSize(size);
              const selected = selectedSize === size;

              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "relative grid min-h-11 min-w-11 place-items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                    selected
                      ? "border-ink bg-ink text-surface"
                      : "border-border-strong bg-surface text-ink hover:bg-surface-muted",
                    disabled &&
                      "border-border bg-surface-muted text-ink-muted after:absolute after:left-3 after:right-3 after:top-1/2 after:h-px after:-rotate-12 after:bg-ink-muted",
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
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="product-quantity"
            >
              Jumlah
            </label>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              {selectedVariantAvailable
                ? `Stok tersedia ${selectedVariant!.stock}. Berat ${selectedVariant!.weightGram} gram per item.`
                : selectedColor && selectedSize
                  ? "Varian ini sedang tidak tersedia."
                  : "Pilih warna dan ukuran untuk melihat stok."}
            </p>
          </div>
          <QuantityStepper
            disabled={!selectedVariantAvailable}
            id="product-quantity"
            max={maxQuantity}
            onChange={(value) => setQuantity(value)}
            value={Math.min(quantity, maxQuantity)}
          />
        </div>

        {error ? (
          <p className="rounded-[var(--radius-md)] bg-danger-bg p-3 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        {message ? (
          <div className="rounded-[var(--radius-md)] bg-success-bg p-3 text-sm font-medium text-success">
            {message}{" "}
            <Link className="underline" href="/cart">
              Lihat keranjang
            </Link>
          </div>
        ) : null}
      </div>

      <button
        className={buttonClasses({
          className: "mt-8 w-full",
          size: "large",
        })}
        disabled={!hydrated || !selectedVariantAvailable}
        onClick={handleAddToCart}
        type="button"
      >
        {!hydrated ? "Menyiapkan keranjang..." : "Tambah ke keranjang"}
      </button>

      <div className="mt-8 rounded-[var(--radius-lg)] bg-info-bg p-5">
        <h2 className="text-sm font-semibold text-info">
          Informasi pengiriman
        </h2>
        <p className="mt-2 text-sm leading-6 text-info">
          Berat varian disimpan dalam gram untuk perhitungan ongkir pada tahap
          pengiriman berikutnya.
        </p>
      </div>
    </section>
  );
}
