import Image from "next/image";
import Link from "next/link";

import { formatRupiah } from "@/lib/pricing";
import type { CatalogProduct } from "@/lib/products";

export function HomepageProductCard({
  presentationImage,
  product,
}: {
  presentationImage?: string;
  product: CatalogProduct;
}) {
  return (
    <article className="group min-w-0">
      <Link className="block" href={`/products/${product.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-surface-container)]">
          <Image
            alt={product.primaryImage.altText}
            className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-blissfy)] group-hover:scale-[1.02]"
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            src={presentationImage ?? product.primaryImage.url}
          />
          {product.discountLabel ? (
            <span className="text-label absolute left-[var(--space-2)] top-[var(--space-2)] bg-[var(--color-background)] px-[var(--space-2)] py-[var(--space-1)] text-[var(--color-error)]">
              {product.discountLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-[var(--space-3)] min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium leading-5 text-[var(--color-text-primary)]">
            {product.name}
          </h3>
          <div className="mt-[var(--space-1)] flex flex-wrap items-baseline gap-x-[var(--space-2)] gap-y-[var(--space-1)]">
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              {formatRupiah(product.salePrice)}
            </p>
            {product.salePrice < product.normalPrice ? (
              <p className="text-xs text-[var(--color-text-muted)] line-through">
                {formatRupiah(product.normalPrice)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
