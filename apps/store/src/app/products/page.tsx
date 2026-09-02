import type { Metadata } from "next";
import Link from "next/link";

import { AllProductsCatalog } from "@/components/store/AllProductsCatalog";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Container } from "@/components/ui/Container";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Products | Blissfy.co",
  description:
    "Discover pieces for Her, Him, and coordinated Couple looks at Blissfy.co.",
};

export default async function ProductsPage() {
  const products = await getCatalogProducts();

  return (
    <>
      <StoreHeader activePath="/products" variant="editorial" />

      <main className="min-h-[70vh] bg-bone text-black" id="main-content">
        <Container className="max-w-[1200px] pb-[72px] pt-[30px] md:pb-24 md:pt-9 lg:pb-[120px] lg:pt-12">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-3 text-[13px] leading-normal text-stone">
              <li>
                <Link
                  className="transition-colors duration-200 hover:text-black focus-visible:rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-black"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-ash">
                ›
              </li>
              <li aria-current="page" className="text-black">
                Products
              </li>
            </ol>
          </nav>

          <header className="mt-[30px] border-b border-black/10 pb-[30px] md:mt-12 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6 md:pb-12">
            <div>
              <h1 className="max-w-[760px] font-goudy-old-style text-[44px] font-normal leading-[0.98] tracking-[-0.025em] sm:text-5xl md:text-[clamp(48px,5vw,72px)]">
                All Products
              </h1>
              <p className="mt-3.5 max-w-[560px] text-sm leading-[1.6] text-stone md:mt-[18px] md:text-[15px]">
                Discover pieces for Her, Him, and coordinated Couple looks.
              </p>
            </div>
            <p className="mt-[18px] text-[13px] leading-normal text-stone md:mt-0 md:pb-[5px] md:whitespace-nowrap">
              {products.length} products
            </p>
          </header>

          {products.length > 0 ? (
            <AllProductsCatalog products={products} />
          ) : (
            <section className="mt-12 border-y border-black/10 px-6 py-[72px] text-center">
              <h2 className="font-goudy-old-style text-[32px] font-normal leading-[1.08] tracking-[-0.012em]">
                The catalog is currently empty
              </h2>

              <p className="mx-auto mt-[18px] max-w-[540px] text-sm leading-[1.6] text-stone">
                Products will appear here as soon as they are available.
              </p>

              <Link
                className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-[5px] border border-cocoa bg-cocoa px-[18px] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black focus-visible:outline-black"
                href="/"
              >
                Return home
              </Link>
            </section>
          )}
        </Container>
      </main>

      <StoreFooter variant="editorial" />
    </>
  );
}
