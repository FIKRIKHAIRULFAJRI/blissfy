"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { StoreButton } from "@/components/store/ui/StoreButton";
import { StoreFieldMessage } from "@/components/store/ui/StoreFieldMessage";
import { ensureCartHydration, useCartStore } from "@/lib/cart/store";
import { formatRupiah } from "@/lib/pricing";
import type { ProductDetail } from "@/lib/products";
import { getPrimaryProductImage } from "@/lib/product-images";
import { cn } from "@/lib/utils";

type ProductPurchaseFormProps = {
  product: ProductDetail;
};

export function ProductPurchaseForm({ product }: ProductPurchaseFormProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const hydrated = useCartStore((state) => state.hydrated);
  const primaryImage = getPrimaryProductImage(product);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBuyNowPending, startBuyNowTransition] = useTransition();

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

  function addSelectedItemToCart() {
    if (!selectedColor || !selectedSize) {
      setError("Pilih warna dan ukuran sebelum menambahkan ke keranjang.");
      return false;
    }

    if (!selectedVariant || !selectedVariantAvailable) {
      setError("Varian ini tidak tersedia untuk dibeli.");
      return false;
    }

    if (!product.id || !selectedVariant.id) {
      setError(
        "Data produk belum lengkap. Muat ulang halaman lalu pilih varian lagi.",
      );
      return false;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      imageUrl: primaryImage.url,
      imageAlt: primaryImage.altText,
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
    return true;
  }

  function handleAddToCart() {
    if (!addSelectedItemToCart()) {
      return;
    }

    setMessage("Produk ditambahkan ke keranjang.");
  }

  function handleBuyNow() {
    if (!addSelectedItemToCart()) {
      return;
    }

    setMessage(null);
    startBuyNowTransition(() => {
      router.push("/checkout");
    });
  }

  return (
    <section className="lg:sticky lg:top-28 lg:self-start lg:pt-4">
      <p className="text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-stone">
        {product.categoryName}
      </p>
      <h1 className="mt-3 max-w-[560px] font-goudy-old-style text-[40px] font-normal leading-[1.02] tracking-[-0.02em] text-black sm:text-5xl">
        {product.name}
      </h1>

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <p className="text-lg font-normal text-black">
          {formatRupiah(product.salePrice)}
        </p>
        {product.salePrice < product.normalPrice ? (
          <>
            <p className="text-sm font-normal text-stone line-through">
              {formatRupiah(product.normalPrice)}
            </p>
            {product.discountLabel ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
                {product.discountLabel}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-12 space-y-10">
        <fieldset>
          <legend className="text-[11px] font-medium uppercase tracking-[0.1em] text-black">
            Warna: {selectedColor || "Pilih warna"}
          </legend>
          <div className="mt-4 flex flex-wrap gap-3">
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
                      ? "ring-1 ring-black ring-offset-4 ring-offset-bone"
                      : "hover:ring-1 hover:ring-ash hover:ring-offset-2 hover:ring-offset-bone",
                    disabled &&
                      "opacity-45 after:absolute after:left-2 after:right-2 after:top-1/2 after:h-px after:-rotate-45 after:bg-stone",
                  )}
                  disabled={disabled}
                  key={color.name}
                  onClick={() => handleColorSelect(color.name)}
                  type="button"
                >
                  <span
                    aria-hidden
                    className="size-8 rounded-full border border-ash"
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
          <legend className="text-[11px] font-medium uppercase tracking-[0.1em] text-black">
            Ukuran
          </legend>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {sizes.map((size) => {
              const disabled = !hasAvailableSize(size);
              const selected = selectedSize === size;

              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "relative grid min-h-11 min-w-11 place-items-center rounded-[5px] border px-2 text-sm font-medium transition-colors",
                    selected
                      ? "border-[#2C2C2A] bg-[#2C2C2A] text-white"
                      : "border-black/15 bg-paper-white text-black hover:border-black",
                    disabled &&
                      "border-black/10 bg-black/5 text-stone after:absolute after:left-3 after:right-3 after:top-1/2 after:h-px after:-rotate-12 after:bg-stone",
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

        <div className="flex items-end justify-between gap-6 border-y border-black/10 py-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-black">
              {selectedVariantAvailable ? "Stok tersedia" : "Ketersediaan"}
            </p>
            <p className="mt-2 max-w-[260px] text-sm leading-normal text-stone">
              {selectedVariantAvailable
                ? `${selectedVariant!.stock} item`
                : selectedColor && selectedSize
                  ? "Varian ini sedang tidak tersedia."
                  : "Pilih warna dan ukuran untuk melihat stok."}
            </p>
          </div>
          <div className="shrink-0">
            <label
              className="block text-right text-[11px] font-medium uppercase tracking-[0.1em] text-black"
              htmlFor="product-quantity"
            >
              Jumlah
            </label>
            <div className="mt-2">
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
          className="mt-6 block rounded-[5px] bg-[var(--color-error-surface)] p-4"
          role="alert"
          variant="error"
        >
          {error}
        </StoreFieldMessage>
      ) : null}
      {message ? (
        <div
          className="mt-6 rounded-[5px] border border-black/10 bg-paper-white p-4 text-sm font-medium text-stone"
          role="status"
        >
          {message}{" "}
          <Link className="underline underline-offset-4" href="/cart">
            Lihat keranjang
          </Link>
        </div>
      ) : null}

      <StoreButton
        className="mt-8 w-full rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] uppercase tracking-[0.08em] text-white hover:bg-black focus-visible:outline-black disabled:border-[#2C2C2A] disabled:bg-[#2C2C2A] disabled:text-white"
        disabled={!hydrated || isBuyNowPending}
        onClick={handleAddToCart}
        size="large"
        type="button"
      >
        {!hydrated ? "Menyiapkan keranjang..." : "Add to Bag"}
      </StoreButton>

      <StoreButton
        className="mt-3 w-full rounded-[5px] border-[#2C2C2A] !bg-white uppercase tracking-[0.08em] text-[#2C2C2A] hover:!bg-[#F3EFE9] hover:text-[#2C2C2A] focus-visible:outline-black disabled:border-[#2C2C2A] disabled:!bg-white disabled:text-[#2C2C2A]"
        disabled={!hydrated || isBuyNowPending}
        onClick={handleBuyNow}
        size="large"
        type="button"
        variant="secondary"
      >
        {isBuyNowPending ? "Mengarahkan ke checkout..." : "Buy Now"}
      </StoreButton>

      <div className="mt-12 border-b border-black/10">
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
    <details className="group border-t border-black/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[18px] text-base font-normal text-black [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          aria-hidden
          className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
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
      <div className="pb-6 pr-8 text-sm leading-[1.6] text-stone">
        {children}
      </div>
    </details>
  );
}
