import Image from "next/image";
import Link from "next/link";

import { storeButtonClasses } from "@/components/store/ui/StoreButton";

type HeroCampaignProps = {
  image: {
    altText: string;
    url: string;
  };
};

export function HeroCampaign({ image }: HeroCampaignProps) {
  return (
    <section
      aria-labelledby="homepage-hero-heading"
      className="relative isolate flex h-[clamp(560px,57vw,819px)] items-center justify-center overflow-hidden bg-[var(--color-text-brand)] text-center text-white"
    >
      <Image
        alt={image.altText}
        className="-z-20 object-cover"
        fill
        priority
        sizes="100vw"
        src={image.url}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/30" />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-[var(--page-margin-mobile)]">
        <h1
          className="text-display text-balance text-white"
          id="homepage-hero-heading"
        >
          Shared or solo, still Blissfy
        </h1>
        <p className="text-body mt-[var(--space-3)] max-w-2xl text-balance text-white/90">
          Curated simplicity for the discerning individual. Discover our latest
          collection of modern minimalist essentials.
        </p>
        <Link
          className={storeButtonClasses({
            className:
              "mt-[var(--space-4)] rounded-[var(--radius-full)] px-[var(--space-4)] text-label !text-[var(--color-action-primary-text)] uppercase tracking-[var(--tracking-label)]",
            size: "compact",
          })}
          href="/products"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
