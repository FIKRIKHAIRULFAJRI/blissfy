import Image from "next/image";
import Link from "next/link";

import { HeroCampaign } from "@/components/store/HeroCampaign";
import { HomepageProductCard } from "@/components/store/HomepageProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const homepageImages = {
  hero: {
    altText:
      "Pasangan mengenakan fashion netral Blissfy.co di interior modern yang terang",
    url: "/homepage/hero-couple.jpg",
  },
  signatureSet: {
    altText:
      "Pasangan mengenakan set fashion merah muda yang serasi di interior terang",
    url: "/homepage/signature-set-editorial.jpg",
  },
};

const categories = [
  {
    href: "/products",
    image: "/homepage/category-her.jpg",
    label: "Her",
  },
  {
    href: "/products",
    image: "/homepage/category-him.jpg",
    label: "Him",
  },
  {
    href: "/products",
    image: "/homepage/category-couples.jpg",
    label: "Couples",
  },
];

export default async function Home() {
  const featuredProducts = await getCatalogProducts({ limit: 4 });

  return (
    <>
      <StoreHeader variant="editorial" />

      <main className="bg-bone text-black [&_a:focus-visible]:outline-black" id="main-content">
        <HeroCampaign image={homepageImages.hero} />

        <section
          aria-labelledby="featured-categories-heading"
          className="py-[72px] sm:py-20 min-[901px]:py-24"
          id="featured-categories"
        >
          <div className="mx-auto w-[calc(100%-40px)] max-w-[1200px]">
            <div className="mb-8 flex items-start justify-between gap-6 sm:mb-12 sm:items-end">
              <h2
                className="max-w-[760px] font-goudy-old-style text-[40px] font-normal leading-[1.05] tracking-[-0.012em] max-[360px]:text-4xl sm:text-[clamp(2.5rem,4vw,3.5rem)]"
                id="featured-categories-heading"
              >
                Featured Categories
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {categories.map((category, index) => (
                <Link
                  className="group block overflow-hidden rounded-[5px] border border-[#e5e3df] bg-paper-white transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cocoa motion-reduce:transition-none"
                  href={category.href}
                  key={category.label}
                >
                  <span className="relative block aspect-[5/4] overflow-hidden bg-paper-white sm:aspect-[4/5]">
                    <Image
                      alt=""
                      className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025] motion-reduce:transition-none"
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      src={category.image}
                    />
                  </span>
                  <span className="flex items-baseline justify-between gap-4 p-5 sm:p-6">
                    <span className="font-goudy-old-style text-[26px] font-normal leading-[1.08] tracking-[-0.012em]">
                      {category.label}
                    </span>
                    <span className="text-xs leading-[1.4] text-stone">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="new-arrivals-heading"
          className="bg-paper-white py-[72px] sm:py-20 min-[901px]:py-24"
          id="new-arrivals"
        >
          <div className="mx-auto w-[calc(100%-40px)] max-w-[1200px]">
            <div className="mb-8 flex items-start justify-between gap-6 sm:mb-12 sm:items-end">
              <h2
                className="max-w-[760px] font-goudy-old-style text-[40px] font-normal leading-[1.05] tracking-[-0.012em] max-[360px]:text-4xl sm:text-[clamp(2.5rem,4vw,3.5rem)]"
                id="new-arrivals-heading"
              >
                New Arrivals
              </h2>
              <Link
                className="inline-flex min-h-11 shrink-0 items-center border-b border-current text-[13px] font-medium uppercase tracking-[0.08em] text-black transition-colors duration-200 hover:text-stone motion-reduce:transition-none max-[360px]:text-[11px]"
                href="/products"
              >
                View All
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 min-[901px]:grid-cols-4 min-[901px]:gap-6">
                {featuredProducts.map((product) => (
                  <HomepageProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[5px] border border-[#e5e3df] bg-paper-white px-6 py-12 text-center">
                <h3 className="font-goudy-old-style text-[26px] font-normal leading-[1.08]">
                  Katalog belum tersedia
                </h3>
                <p className="mx-auto mt-3 max-w-[420px] text-sm leading-normal text-stone">
                  Produk akan tampil di sini setelah katalog tersedia.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          aria-labelledby="signature-set-heading"
          className="bg-canvas py-[72px] text-black sm:py-20 min-[901px]:py-24 [&_a:focus-visible]:outline-black"
        >
          <div className="mx-auto grid w-[calc(100%-40px)] max-w-[1200px] grid-cols-1 items-center gap-10 sm:gap-12 min-[901px]:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] min-[901px]:gap-[clamp(48px,7vw,96px)]">
            <div className="relative aspect-square overflow-hidden rounded-[5px] bg-black sm:aspect-[4/3]">
              <Image
                alt={homepageImages.signatureSet.altText}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                src={homepageImages.signatureSet.url}
              />
            </div>

            <div className="max-w-[680px]">
              <h2
                className="max-w-[520px] font-goudy-old-style text-[40px] font-normal leading-[1.05] tracking-[-0.012em] max-[360px]:text-4xl sm:text-[clamp(2.5rem,4vw,3.5rem)]"
                id="signature-set-heading"
              >
                The Signature Set
              </h2>
              <p className="mt-6 max-w-[500px] text-base leading-normal text-stone">
                Curated combinations designed for effortless harmony. Discover
                pieces that speak the same minimalist language, whether worn
                solo or shared.
              </p>
              <Link
                className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[5px] border border-black bg-black px-4 py-[9px] text-[13px] font-medium uppercase tracking-[0.06em] text-white transition-colors duration-200 hover:bg-transparent hover:text-black focus-visible:outline-black motion-reduce:transition-none"
                href="/products"
              >
                Eksplorasi Set
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="elevated-simplicity-heading"
          className="bg-paper-white py-24 text-center sm:py-[120px]"
        >
          <div className="mx-auto w-[calc(100%-40px)] max-w-[760px]">
            <hr className="mx-auto mb-8 h-px w-12 border-0 bg-cocoa sm:mb-12" />
            <h2
              className="font-goudy-old-style text-[40px] font-normal leading-[1.05] tracking-[-0.012em] max-[360px]:text-4xl sm:text-[clamp(2.5rem,5vw,3.5rem)]"
              id="elevated-simplicity-heading"
            >
              Elevated Simplicity
            </h2>
            <p className="mx-auto mt-6 max-w-[600px] text-base leading-normal text-stone">
              Mindfully crafted pieces designed to blend seamlessly into your
              curated life. Slow fashion, high impact.
            </p>
          </div>
        </section>
      </main>

      <div className="flow-root bg-paper-white">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
