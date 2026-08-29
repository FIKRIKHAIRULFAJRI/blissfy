import type { Metadata } from "next";
import Link from "next/link";

import { AllProductsCatalog } from "@/components/store/AllProductsCatalog";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { storeButtonClasses } from "@/components/store/ui/StoreButton";
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
      <StoreHeader activePath="/products" />

      <main className="bg-[var(--color-canvas)]" id="main-content">
        <Container className="pb-[var(--space-6)] pt-[var(--space-5)] lg:pt-[var(--space-5)]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-[var(--space-3)] text-sm leading-6 text-[var(--color-text-muted)]">
              <li>
                <Link
                  className="transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action-primary)]"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-[var(--color-border-strong)]">
                ›
              </li>
              <li aria-current="page" className="text-[var(--color-text-secondary)]">
                Products
              </li>
            </ol>
          </nav>

          <header className="mt-[var(--space-4)]">
            <div className="flex flex-wrap items-baseline gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
              <h1 className="text-display text-[var(--color-text-primary)]">
                All Products
              </h1>
              <p className="text-sm font-normal text-[var(--color-text-muted)] sm:text-base">
                {products.length} products
              </p>
            </div>
            <p className="mt-[var(--space-2)] text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
              Discover pieces for Her, Him, and coordinated Couple looks.
            </p>
          </header>

          {products.length > 0 ? (
            <AllProductsCatalog products={products} />
          ) : (
            <section className="mt-[var(--space-5)] border-y border-[var(--color-border)] py-[var(--space-6)] text-center">
              <h2 className="text-heading text-[var(--color-text-primary)]">
                The catalog is currently empty
              </h2>

              <p className="mx-auto mt-[var(--space-3)] max-w-xl text-base leading-7 text-[var(--color-text-muted)]">
                Products will appear here as soon as they are available.
              </p>

              <Link
                className={storeButtonClasses({
                  className: "mt-[var(--space-4)] rounded-[var(--radius-default)]",
                  variant: "secondary",
                })}
                href="/"
              >
                Return home
              </Link>
            </section>
          )}
        </Container>
      </main>

      <StoreFooter />
    </>
  );
}
