import Image from "next/image";
import Link from "next/link";

import { formatRupiah } from "@/lib/placeholders";
import { getPrimaryProductImage } from "@/lib/product-images";
import type { CatalogProduct } from "@/lib/products";

export function AllProductsCard({
  eager = false,
  product,
}: {
  eager?: boolean;
  product: CatalogProduct;
}) {
  const isOnSale = product.salePrice < product.normalPrice;
  const primaryImage = getPrimaryProductImage(product);

  return (
    <article className="group min-w-0">
      <Link
        className="block text-black focus-visible:rounded-[5px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[5px] focus-visible:outline-black"
        href={`/products/${product.slug}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-[5px] bg-[#e8e5df]">
          <Image
            alt={primaryImage.altText}
            className={
              product.isAvailable
                ? "object-cover transition-transform duration-[400ms] ease-out motion-reduce:transition-none group-hover:scale-[1.015]"
                : "object-cover opacity-[0.58] grayscale-[25%]"
            }
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(max-width: 1023px) 50vw, 33vw"
            src={primaryImage.url}
          />

          {isOnSale ? (
            <span className="absolute left-2 top-2 rounded-[5px] bg-cocoa px-2 py-1.5 text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-[7px]">
              Sale
            </span>
          ) : null}

          {!product.isAvailable ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/35">
              <span className="rounded-[5px] border border-black/10 bg-paper-white px-3.5 py-2.5 text-[10px] font-medium uppercase leading-none tracking-[0.07em] text-black">
                Out of stock
              </span>
            </div>
          ) : null}
        </div>

        <div className="pt-3 sm:pt-4">
          <p className="truncate text-[11px] font-normal uppercase leading-[1.4] tracking-[0.06em] text-stone">
            {product.categoryName}
          </p>
          <h2 className="mt-1.5 line-clamp-2 min-h-[43px] font-goudy-old-style text-xl font-normal leading-[1.08] tracking-[-0.012em] sm:min-h-[52px] sm:text-2xl">
            {product.name}
          </h2>
          <div className="mt-[9px] flex flex-wrap items-baseline gap-x-2 gap-y-[3px] text-[13px] leading-normal text-black sm:gap-x-3 sm:gap-y-1.5 sm:text-sm">
            <span
              className="font-normal"
            >
              {formatRupiah(product.salePrice)}
            </span>
            {isOnSale ? (
              <span className="text-[11px] font-normal text-stone line-through sm:text-xs">
                {formatRupiah(product.normalPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
