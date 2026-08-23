import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/lib/placeholders";
import type { CatalogProduct } from "@/lib/products";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="group">
      <Link
        className="block focus-visible:rounded-[var(--radius-lg)]"
        href={`/products/${product.slug}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
          <Image
            alt={product.primaryImage.altText}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            src={product.primaryImage.url}
          />
          {product.discountLabel ? (
            <span className="absolute left-3 top-3 rounded-full bg-clay px-3 py-1.5 text-xs font-semibold text-surface">
              {product.discountLabel}
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase leading-tight text-ink-muted">
                {product.categoryName}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-ink sm:text-base">
                {product.name}
              </h3>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-ink">
                {formatRupiah(product.salePrice)}
              </p>
              {product.salePrice < product.normalPrice ? (
                <p className="text-xs font-medium text-ink-muted line-through">
                  {formatRupiah(product.normalPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {product.colors.map((color) => (
                <span
                  aria-label={color.name}
                  className="size-4 rounded-full border border-border-strong"
                  key={color.name}
                  role="img"
                  style={{ backgroundColor: color.value ?? "#FFFEFA" }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-ink-muted">
              {product.isAvailable ? "Ready stock" : "Stok habis"}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
