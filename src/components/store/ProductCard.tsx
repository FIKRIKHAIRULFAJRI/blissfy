import Link from "next/link";
import { formatRupiah } from "@/lib/placeholders";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/store";

const toneClasses: Record<Product["imageTone"], string> = {
  ivory: "bg-surface-muted",
  stone: "bg-border",
  olive: "bg-olive/25",
  taupe: "bg-taupe/30",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group">
      <Link
        className="block focus-visible:rounded-[var(--radius-lg)]"
        href={`/products/${product.slug}`}
      >
        <div
          className={cn(
            "relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]",
            toneClasses[product.imageTone],
          )}
        >
          <div
            aria-hidden
            className="absolute inset-x-[18%] bottom-0 h-[78%] rounded-t-full bg-surface/70 transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div
            aria-hidden
            className="absolute inset-x-[28%] bottom-0 h-[54%] rounded-t-[4rem] bg-ink/10"
          />
          <span className="sr-only">
            Placeholder foto produk {product.name}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase leading-tight text-ink-muted">
                {product.category}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-ink sm:text-base">
                {product.name}
              </h3>
            </div>
            <p className="shrink-0 text-sm font-semibold text-ink">
              {formatRupiah(product.price)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {product.colors.map((color) => (
              <span
                aria-label={color.name}
                className="size-4 rounded-full border border-border-strong"
                key={color.name}
                role="img"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
