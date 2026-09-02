import Image from "next/image";
import Link from "next/link";

import { getPrimaryProductImage } from "@/lib/product-images";
import { formatRupiah } from "@/lib/pricing";
import type { CatalogProduct } from "@/lib/products";

export function HomepageProductCard({ product }: { product: CatalogProduct }) {
  const primaryImage = getPrimaryProductImage(product);

  return (
    <article className="group h-full min-w-0">
      <Link
        className="flex h-full flex-col overflow-hidden rounded-[5px] border border-[#e5e3df] bg-paper-white transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cocoa focus-visible:outline-black motion-reduce:transition-none"
        href={`/products/${product.slug}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-bone">
          <Image
            alt={primaryImage.altText}
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:transition-none"
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            src={primaryImage.url}
          />
          {product.discountLabel ? (
            <span className="absolute left-2 top-2 rounded-[5px] border border-[#e5e3df] bg-paper-white px-2 py-1.5 text-[11px] font-medium uppercase leading-none tracking-[0.04em] text-black sm:left-3 sm:top-3">
              {product.discountLabel}
            </span>
          ) : null}
        </div>

        <div className="flex-1 px-3 pb-[18px] pt-4 sm:p-5 min-[901px]:p-6">
          <h3 className="font-goudy-old-style text-lg font-normal leading-[1.15] tracking-[-0.012em] max-[360px]:text-base sm:text-xl">
            {product.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <p className="text-[13px] leading-[1.4] max-[360px]:text-xs">
              {formatRupiah(product.salePrice)}
            </p>
            {product.salePrice < product.normalPrice ? (
              <p className="text-[13px] leading-[1.4] text-stone line-through max-[360px]:text-xs">
                {formatRupiah(product.normalPrice)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
