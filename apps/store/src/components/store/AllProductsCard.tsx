import Image from "next/image";
import Link from "next/link";

import { formatRupiah } from "@/lib/placeholders";
import type { CatalogProduct } from "@/lib/products";

export function AllProductsCard({
  eager = false,
  product,
}: {
  eager?: boolean;
  product: CatalogProduct;
}) {
  const isOnSale = product.salePrice < product.normalPrice;

  return (
    <article className="group min-w-0">
      <Link
        className="block rounded-[var(--radius-default)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-action-primary)]"
        href={`/products/${product.slug}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-default)] bg-[var(--color-surface-container)]">
          <Image
            alt={product.primaryImage.altText}
            className={
              product.isAvailable
                ? "object-cover transition-transform duration-[var(--duration-default)] ease-[var(--ease-blissfy)] group-hover:scale-[1.02]"
                : "object-cover opacity-55 grayscale-[20%]"
            }
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(max-width: 1023px) 50vw, 33vw"
            src={product.primaryImage.url}
          />

          {isOnSale ? (
            <span className="absolute left-[var(--space-3)] top-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-error-surface)] px-3 py-2 text-[10px] font-medium uppercase leading-none tracking-[0.05em] text-[var(--color-text-secondary)]">
              Sale
            </span>
          ) : null}

          {!product.isAvailable ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/35">
              <span className="rounded-[var(--radius-sm)] bg-white px-4 py-3 text-[10px] font-medium uppercase leading-none tracking-[0.05em] text-[var(--color-text-secondary)] shadow-[var(--shadow-card)]">
                Out of stock
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-[var(--space-3)]">
          <p className="truncate text-xs font-medium leading-5 tracking-[0.02em] text-[var(--color-text-muted)]">
            {product.categoryName}
          </p>
          <h2 className="mt-[var(--space-1)] line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[var(--color-text-secondary)] sm:text-base sm:leading-6">
            {product.name}
          </h2>
          <div className="mt-[var(--space-1)] flex flex-wrap items-baseline gap-x-[var(--space-3)] gap-y-[var(--space-1)] text-sm leading-6 sm:text-base">
            <span
              className={
                isOnSale
                  ? "font-medium text-clay"
                  : "font-normal text-[var(--color-text-secondary)]"
              }
            >
              {formatRupiah(product.salePrice)}
            </span>
            {isOnSale ? (
              <span className="text-xs font-normal text-[var(--color-text-muted)] line-through sm:text-sm">
                {formatRupiah(product.normalPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
