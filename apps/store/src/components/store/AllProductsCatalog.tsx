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
    <div className="mt-[var(--space-5)] grid gap-[var(--space-5)] lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside aria-label="Product filters" className="hidden min-w-0 lg:block">
        <FilterContent className="grid gap-[var(--space-5)]" />
      </aside>

      <section aria-label="Product catalog" className="min-w-0">
        <div className="flex flex-col gap-[var(--space-3)] lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-[288px]">
            <span className="sr-only">Search apparel</span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-[var(--space-3)] top-1/2 z-10 -translate-y-1/2 text-[var(--color-text-muted)]"
            >
              <SearchIcon />
            </span>
            <StoreInput
              className="rounded-[var(--radius-default)] pl-12"
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

        <div className="mt-[var(--space-3)] flex flex-wrap items-center justify-between gap-x-[var(--space-3)] gap-y-[var(--space-2)] lg:hidden">
          <StoreButton
            aria-controls="mobile-product-filters"
            aria-expanded={filtersOpen}
            className="rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 active:scale-[0.98]"
            onClick={() => setFiltersOpen((isOpen) => !isOpen)}
            size="compact"
            style={{ color: "var(--color-text-brand)" }}
            variant="inverse"
          >
            <FilterIcon />
            Filter
          </StoreButton>

          <CatalogControls />
        </div>

        <aside
          aria-label="Mobile product filters"
          className="mt-[var(--space-3)] rounded-[var(--radius-default)] border border-[var(--color-border)] bg-[var(--color-surface)]/55 p-[var(--space-3)] lg:hidden"
          hidden={!filtersOpen}
          id="mobile-product-filters"
        >
          <FilterContent className="grid grid-cols-2 gap-[var(--space-4)]" />
        </aside>

        <p aria-live="polite" className="sr-only">
          {filteredProducts.length} products found
        </p>

        {visibleProducts.length > 0 ? (
          <div className="mt-[var(--space-4)] grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-5)] sm:gap-x-[var(--space-4)] lg:mt-[var(--space-5)] lg:grid-cols-3">
            {visibleProducts.map((product, index) => (
              <AllProductsCard
                eager={index < 3}
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="mt-[var(--space-5)] border-y border-[var(--color-border)] py-[var(--space-6)] text-center">
            <h2 className="text-heading text-[var(--color-text-primary)]">
              No products found
            </h2>
            <p className="mx-auto mt-[var(--space-3)] max-w-lg text-base text-[var(--color-text-muted)]">
              Try another product name or category.
            </p>
          </div>
        )}

        {hasMoreProducts ? (
          <div className="mt-[var(--space-6)] flex justify-center">
            <StoreButton
              className="min-w-56 rounded-[var(--radius-default)] px-[var(--space-5)]"
              onClick={() =>
                setVisibleCount((count) => count + LOAD_MORE_COUNT)
              }
            >
              <span className="leading-5">
                Load
                <br />
                More
              </span>
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
        <h2 className="text-lg font-medium leading-7 text-[var(--color-text-secondary)]">
          Shop By
        </h2>
        <ul className="mt-[var(--space-3)] space-y-[var(--space-2)] text-base leading-6 text-[var(--color-text-secondary)]">
          <li className="font-semibold text-[var(--color-text-primary)]">
            All Products
          </li>
          {audienceLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </nav>

      <fieldset disabled>
        <legend className="text-lg font-medium leading-7 text-[var(--color-text-secondary)]">
          Category
        </legend>
        <div className="mt-[var(--space-3)] space-y-[var(--space-2)]">
          {audienceLabels.map((label) => (
            <label
              className="flex min-h-8 items-center gap-[var(--space-3)] text-base leading-6 text-[var(--color-text-secondary)]"
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
    <div className="flex min-h-12 items-center justify-end gap-[var(--space-2)] text-sm text-[var(--color-text-muted)] sm:gap-[var(--space-4)]">
      <div
        aria-label="Sort order: Newest"
        className="flex items-center gap-[var(--space-2)] sm:gap-[var(--space-3)]"
      >
        <span>Sort by:</span>
        <span className="font-medium text-[var(--color-text-secondary)]">
          Newest
        </span>
        <CaretDownIcon />
      </div>

      <span aria-hidden className="h-8 w-px bg-[var(--color-border)]" />

      <div
        aria-label="Product view"
        className="flex items-center gap-[var(--space-2)]"
      >
        <span aria-label="Grid view selected" role="img">
          <GridIcon />
        </span>
        <span
          aria-label="List view unavailable"
          className="text-[var(--color-text-muted)]"
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
    <svg aria-hidden className="size-5 text-[var(--color-text-brand)]" fill="none" viewBox="0 0 20 20">
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
