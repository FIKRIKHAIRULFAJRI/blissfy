"use client";

import { useMemo, useState } from "react";

import { AllProductsCard } from "@/components/store/AllProductsCard";
import { StoreButton } from "@/components/store/ui/StoreButton";
import { StoreCheckbox } from "@/components/store/ui/StoreCheckbox";
import { StoreInput } from "@/components/store/ui/StoreInput";
import type { CatalogProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_COUNT = 6;

const audienceLabels = ["Her", "Him", "Couple"];

export function AllProductsCatalog({
  products,
}: {
  products: CatalogProduct[];
}) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.categoryName}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;

  function handleSearch(value: string) {
    setQuery(value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  return (
    <div className="mt-[30px] lg:mt-12 lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-12">
      <aside aria-label="Product filters" className="hidden min-w-0 lg:block">
        <FilterContent className="grid gap-[42px]" />
      </aside>

      <section aria-label="Product catalog" className="min-w-0">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
          <label className="relative block w-full lg:max-w-[340px]">
            <span className="sr-only">Search apparel</span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-stone"
            >
              <SearchIcon />
            </span>
            <StoreInput
              className="min-h-[52px] rounded-[5px] border-black/10 bg-paper-white pl-12 text-sm text-black shadow-none hover:border-ash focus:border-black focus-visible:outline-black"
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search apparel..."
              type="search"
              value={query}
            />
          </label>

          <div className="hidden lg:block">
            <CatalogControls />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <StoreButton
            aria-controls="mobile-product-filters"
            aria-expanded={filtersOpen}
            className="min-h-11 rounded-[5px] border border-black/10 bg-paper-white font-medium text-black shadow-none hover:border-ash hover:bg-[#f8f7f4] focus-visible:outline-black active:scale-[0.98]"
            onClick={() => setFiltersOpen((isOpen) => !isOpen)}
            size="compact"
            variant="inverse"
          >
            <FilterIcon />
            Filter
          </StoreButton>

          <CatalogControls />
        </div>

        <aside
          aria-label="Mobile product filters"
          className="mt-[18px] rounded-[5px] border border-black/10 bg-paper-white p-6 lg:hidden"
          hidden={!filtersOpen}
          id="mobile-product-filters"
        >
          <FilterContent className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 sm:gap-8" />
        </aside>

        <p aria-live="polite" className="sr-only">
          {filteredProducts.length} products found
        </p>

        {visibleProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-[30px] sm:mt-[30px] sm:gap-x-4 sm:gap-y-9 lg:mt-8 lg:grid-cols-3 lg:gap-x-[18px] lg:gap-y-12">
            {visibleProducts.map((product, index) => (
              <AllProductsCard
                eager={index < 3}
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 border-y border-black/10 px-6 py-[72px] text-center">
            <h2 className="font-goudy-old-style text-[32px] font-normal leading-[1.08] tracking-[-0.012em]">
              No products found
            </h2>
            <p className="mx-auto mt-[18px] max-w-[540px] text-sm leading-[1.6] text-stone">
              Try another product name or category.
            </p>
          </div>
        )}

        {hasMoreProducts ? (
          <div className="mt-[54px] flex justify-center md:mt-[72px]">
            <StoreButton
              className="min-h-12 min-w-[184px] rounded-[5px] border border-cocoa bg-cocoa text-[13px] font-medium leading-none text-white shadow-none hover:bg-black focus-visible:outline-black"
              onClick={() =>
                setVisibleCount((count) => count + LOAD_MORE_COUNT)
              }
            >
              Load More
            </StoreButton>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FilterContent({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <nav aria-label="Shop by audience">
        <h2 className="font-goudy-old-style text-2xl font-normal leading-[1.08] tracking-[-0.012em] text-black">
          Shop By
        </h2>
        <ul className="mt-[18px] grid gap-[9px] text-sm leading-normal text-stone">
          <li className="text-black underline underline-offset-4">
            All Products
          </li>
          {audienceLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </nav>

      <fieldset disabled>
        <legend className="font-goudy-old-style text-2xl font-normal leading-[1.08] tracking-[-0.012em] text-black">
          Category
        </legend>
        <div className="mt-[18px] grid gap-[9px] text-sm leading-normal text-stone">
          {audienceLabels.map((label) => (
            <label
              className="flex min-h-[30px] items-center gap-3"
              key={label}
            >
              <StoreCheckbox className="size-4 rounded-[var(--radius-sm)] disabled:border-[var(--color-border)] disabled:bg-[var(--color-surface)]" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <p className="sr-only">
          Audience filters are shown for design fidelity but are unavailable
          because the current catalog does not provide audience data.
        </p>
      </fieldset>
    </div>
  );
}

function CatalogControls() {
  return (
    <div className="flex min-h-12 items-center justify-end gap-2.5 text-xs text-stone sm:gap-[18px] sm:text-[13px]">
      <div
        aria-label="Sort order: Newest"
        className="flex items-center gap-1.5 sm:gap-2.5"
      >
        <span>Sort by:</span>
        <span className="text-black">
          Newest
        </span>
        <CaretDownIcon />
      </div>

      <span aria-hidden className="hidden h-7 w-px bg-black/10 sm:block" />

      <div
        aria-label="Product view"
        className="hidden items-center gap-[9px] sm:flex"
      >
        <span aria-label="Grid view selected" className="text-black" role="img">
          <GridIcon />
        </span>
        <span
          aria-label="List view unavailable"
          className="text-ash"
          role="img"
        >
          <ListIcon />
        </span>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M2 4h12M4.5 8h7M7 12h2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CaretDownIcon() {
  return (
    <svg aria-hidden className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="m4.5 6 3.5 3.5L11.5 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden className="size-5" fill="none" viewBox="0 0 20 20">
      <rect height="5" rx="0.75" stroke="currentColor" strokeWidth="1.5" width="5" x="2" y="2" />
      <rect height="5" rx="0.75" stroke="currentColor" strokeWidth="1.5" width="5" x="13" y="2" />
      <rect height="5" rx="0.75" stroke="currentColor" strokeWidth="1.5" width="5" x="2" y="13" />
      <rect height="5" rx="0.75" stroke="currentColor" strokeWidth="1.5" width="5" x="13" y="13" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden className="size-5" fill="none" viewBox="0 0 20 20">
      <rect height="4" rx="1" stroke="currentColor" strokeWidth="1.5" width="16" x="2" y="3" />
      <rect height="4" rx="1" stroke="currentColor" strokeWidth="1.5" width="16" x="2" y="13" />
    </svg>
  );
}
