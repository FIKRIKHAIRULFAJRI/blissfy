import Image from "next/image";
import Link from "next/link";

import { HeroCampaign } from "@/components/store/HeroCampaign";
import { HomepageProductCard } from "@/components/store/HomepageProductCard";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { storeButtonClasses } from "@/components/store/ui/StoreButton";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
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

const newArrivalPresentationImages = [
  "/homepage/newarrival-1.jpeg",
  "/homepage/newarrival-2.jpeg",
  "/homepage/newarrival-3.jpeg",
  "/homepage/newarrival-4.jpeg",
];

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
      <StoreHeader />

      <main id="main-content">
        <HeroCampaign image={homepageImages.hero} />

        <Section
          aria-labelledby="featured-categories-heading"
          className="bg-[var(--color-canvas)]"
          id="featured-categories"
          spacing="large"
        >
          <Container>
            <h2
              className="text-label uppercase text-[var(--color-text-primary)]"
              id="featured-categories-heading"
            >
              Featured Categories
            </h2>

            <div className="mt-[var(--space-4)] flex items-start justify-center gap-[var(--space-3)] sm:gap-[var(--space-5)] lg:mt-[var(--space-3)]">
              {categories.map((category) => (
                <Link
                  className="group flex min-w-0 flex-1 flex-col items-center text-center sm:max-w-40"
                  href={category.href}
                  key={category.label}
                >
                  <span className="relative size-[72px] overflow-hidden rounded-full bg-[var(--color-surface-container)] sm:size-24 lg:size-32">
                    <Image
                      alt=""
                      className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-blissfy)] group-hover:scale-[1.04]"
                      fill
                      sizes="(min-width: 1024px) 128px, (min-width: 640px) 96px, 72px"
                      src={category.image}
                    />
                  </span>
                  <span className="mt-[var(--space-3)] min-h-11 text-sm font-medium text-[var(--color-text-primary)]">
                    {category.label}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section
          aria-labelledby="new-arrivals-heading"
          className="bg-[var(--color-surface)]"
          id="new-arrivals"
          spacing="large"
        >
          <Container>
            <div className="flex items-center justify-between gap-[var(--space-4)]">
              <h2
                className="text-heading text-[var(--color-text-primary)]"
                id="new-arrivals-heading"
              >
                New Arrivals
              </h2>
              <Link
                className="text-label flex min-h-11 items-center uppercase text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                href="/products"
              >
                View All
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="mt-[var(--space-4)] grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-5)] lg:grid-cols-4 lg:gap-x-[var(--space-4)]">
                {featuredProducts.map((product, index) => (
                  <HomepageProductCard
                    key={product.id}
                    presentationImage={newArrivalPresentationImages[index]}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-[var(--space-5)] py-[var(--space-5)] text-center">
                <h3 className="text-heading text-[var(--color-text-primary)]">
                  Katalog belum tersedia
                </h3>
                <p className="text-body mx-auto mt-[var(--space-3)] max-w-md text-[var(--color-text-secondary)]">
                  Produk akan tampil di sini setelah katalog tersedia.
                </p>
              </div>
            )}
          </Container>
        </Section>

        <Section
          aria-labelledby="signature-set-heading"
          className="bg-[var(--color-canvas)]"
          spacing="large"
        >
          <Container className="grid gap-[var(--space-5)] md:grid-cols-2 md:items-center md:gap-[var(--space-6)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-container)]">
              <Image
                alt={homepageImages.signatureSet.altText}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                src={homepageImages.signatureSet.url}
              />
            </div>

            <div className="max-w-xl md:justify-self-center">
              <h2
                className="text-heading text-[var(--color-text-primary)]"
                id="signature-set-heading"
              >
                The Signature Set
              </h2>
              <p className="text-body mt-[var(--space-3)] text-[var(--color-text-secondary)]">
                Curated combinations designed for effortless harmony. Discover
                pieces that speak the same minimalist language, whether worn
                solo or shared.
              </p>
              <Link
                className={storeButtonClasses({
                  className:
                    "mt-[var(--space-4)] rounded-[var(--radius-full)] px-[var(--space-4)] text-label !text-[var(--color-action-primary-text)] uppercase tracking-[var(--tracking-label)]",
                  size: "compact",
                })}
                href="/products"
              >
                Eksplorasi Set
              </Link>
            </div>
          </Container>
        </Section>

        <Section
          aria-labelledby="elevated-simplicity-heading"
          className="bg-[var(--color-canvas)] text-center"
          spacing="large"
        >
          <Container className="flex flex-col items-center">
            <ClothingIcon />
            <h2
              className="text-display mt-[var(--space-4)] text-[var(--color-text-primary)]"
              id="elevated-simplicity-heading"
            >
              Elevated Simplicity
            </h2>
            <p className="text-body mt-[var(--space-3)] max-w-2xl text-[var(--color-text-secondary)]">
              Mindfully crafted pieces designed to blend seamlessly into your
              curated life. Slow fashion, high impact.
            </p>
          </Container>
        </Section>
      </main>

      <StoreFooter />
    </>
  );
}

function ClothingIcon() {
  return (
    <svg
      aria-hidden
      className="size-8 text-[var(--color-text-primary)]"
      fill="none"
      viewBox="0 0 32 32"
    >
      <path
        d="M13.5 7.5a2.5 2.5 0 1 1 3.7 2.2L16 10.5v2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m7 18 9-5 9 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 16.5v8h12v-8"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M10 19h12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
