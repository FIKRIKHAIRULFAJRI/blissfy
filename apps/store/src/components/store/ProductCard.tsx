import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/lib/placeholders";
import type { CatalogProduct } from "@/lib/products";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="group min-w-0">
      <Link
        className="block text-black focus-visible:rounded-[5px] focus-visible:outline-black"
        href={`/products/${product.slug}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-[5px] bg-[#e8e5df]">
          <Image
            alt={product.primaryImage.altText}
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:transition-none"
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            src={product.primaryImage.url}
          />
          {product.discountLabel ? (
            <span className="absolute left-2 top-2 rounded-[5px] bg-cocoa px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white sm:left-3 sm:top-3 sm:px-2.5">
              {product.discountLabel}
            </span>
          ) : null}
        </div>
        <div className="pt-3 sm:pt-4">
          <div>
            <div>
              <p className="truncate text-[10px] font-normal uppercase leading-[1.4] tracking-[0.07em] text-stone sm:text-[11px]">
                {product.categoryName}
              </p>
              <h3 className="mt-1.5 line-clamp-2 min-h-[43px] font-goudy-old-style text-xl font-normal leading-[1.08] tracking-[-0.012em] sm:min-h-[52px] sm:text-2xl">
                {product.name}
              </h3>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-left">
              <p className="text-[13px] font-normal text-black sm:text-sm">
                {formatRupiah(product.salePrice)}
              </p>
              {product.salePrice < product.normalPrice ? (
                <p className="text-[11px] font-normal text-stone line-through sm:text-xs">
                  {formatRupiah(product.normalPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {product.colors.map((color) => (
                <span
                  aria-label={color.name}
                  className="size-3.5 rounded-full border border-ash"
                  key={color.name}
                  role="img"
                  style={{ backgroundColor: color.value ?? "#FFFEFA" }}
                />
              ))}
            </div>
            <p className="text-[11px] font-normal text-stone">
              {product.isAvailable ? "Ready stock" : "Stok habis"}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
