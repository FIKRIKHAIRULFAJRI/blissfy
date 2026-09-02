import type { Metadata } from "next";
import Image from "next/image";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About | Blissfy.co",
  description:
    "Discover Blissfy.co's approach to thoughtful, coordinated fashion for Her, Him, and Couple.",
};

const values = [
  {
    icon: "together",
    title: "Coordinated, Not Identical",
    description:
      "Designed to feel connected through color, fabric, and subtle details — without looking exactly the same.",
  },
  {
    icon: "sparkle",
    title: "Feminine Elegance",
    description:
      "Soft structure, thoughtful silhouettes, and subtle details designed for an effortless feminine look.",
  },
  {
    icon: "hanger",
    title: "Relaxed Smart-Casual",
    description:
      "Clean, structured pieces with a relaxed approach to modern everyday menswear.",
  },
  {
    icon: "texture",
    title: "Thoughtful Materials",
    description:
      "Comfortable fabrics and considered details chosen to support everyday wear and lasting style.",
  },
] as const;

const galleryImages = [
  {
    alt: "Blissfy womenswear in a softly lit neutral interior",
    className: "md:col-start-1 md:row-start-1",
    imageClassName: "object-cover",
    src: "/homepage/category-her.jpg",
  },
  {
    alt: "Blissfy coordinated couple in matching rose outfits",
    className: "md:col-start-2 md:row-span-2 md:row-start-1",
    imageClassName: "object-cover",
    src: "/homepage/signature-set-editorial.jpg",
  },
  {
    alt: "Blissfy menswear editorial detail",
    className: "md:col-start-3 md:row-start-1",
    imageClassName: "object-cover",
    src: "/homepage/category-him.jpg",
  },
  {
    alt: "A couple wearing neutral Blissfy fashion in a modern interior",
    className: "md:col-start-1 md:row-start-2",
    imageClassName: "object-cover object-center",
    src: "/homepage/hero-couple.jpg",
  },
  {
    alt: "A coordinated Blissfy couple styled together",
    className: "md:col-start-3 md:row-start-2",
    imageClassName: "object-cover object-center",
    src: "/homepage/category-couples.jpg",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <StoreHeader activePath="/about" variant="editorial" />

      <main className="bg-bone text-black" id="main-content">
        <Container className="pb-12 pt-[72px] sm:pt-24 lg:pb-16 lg:pt-[120px]">
          <div className="mx-auto max-w-[1200px]">
          <section
            aria-labelledby="about-heading"
            className="grid grid-cols-1 items-center gap-[48px] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-[80px] xl:gap-[120px]"
          >
            <div className="max-w-[480px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
                About Blissfy
              </p>
              <h1
                className="mt-4 font-goudy-old-style text-[44px] font-normal leading-[1.02] tracking-[-0.02em] sm:text-[56px]"
                id="about-heading"
              >
                Shared or solo,
                <br />
                still Blissfy.
              </h1>
              <div className="mt-7 flex flex-col gap-5 text-sm leading-[1.65] text-stone sm:text-[15px]">
                <p>
                  Blissfy.co creates modern fashion for Her, Him, and Couple —
                  designed to feel complete on its own and naturally connected
                  when worn together.
                </p>
                <p>
                  We believe coordinated fashion does not have to look
                  identical. Through thoughtful colors, silhouettes, and subtle
                  details, every Blissfy piece is made to feel distinctly yours.
                </p>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[5px] bg-[#e8e5df] sm:aspect-[5/4] lg:aspect-[15/16]">
              <Image
                alt="A coordinated Blissfy couple wearing understated neutral fashion"
                className="object-cover object-center"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 58vw"
                src="/homepage/category-couples.jpg"
              />
            </div>
          </section>

          <section
            aria-label="Blissfy values"
            className="mt-[80px] grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-[120px] lg:grid-cols-4 lg:gap-6"
          >
            {values.map((value) => (
              <article
                className="min-h-[260px] rounded-[5px] border border-black/10 bg-paper-white p-6 sm:min-h-[280px]"
                key={value.title}
              >
                <ValueIcon kind={value.icon} />
                <h2 className="mt-6 max-w-[190px] font-goudy-old-style text-[26px] font-normal leading-[1.05] tracking-[-0.012em]">
                  {value.title}
                </h2>
                <p className="mt-4 text-[13px] leading-[1.6] text-stone">
                  {value.description}
                </p>
              </article>
            ))}
          </section>

          <section
            aria-labelledby="aesthetic-heading"
            className="pb-12 pt-24 sm:pt-[120px] lg:pb-16"
          >
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
                Our visual language
              </p>
              <h2
                className="mt-4 font-goudy-old-style text-[40px] font-normal leading-[1.05] tracking-[-0.012em] sm:text-[48px]"
                id="aesthetic-heading"
              >
                The Blissfy Aesthetic
              </h2>
              <p className="mx-auto mt-4 max-w-[620px] text-sm leading-[1.6] text-stone">
                Soft tones, clean silhouettes, natural moments, and effortless
                coordination.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:h-[720px] md:grid-cols-3 md:grid-rows-2 sm:mt-12">
              {galleryImages.map((image) => (
                <div
                  className={cn(
                    "relative min-h-[320px] overflow-hidden rounded-[5px] bg-[#e8e5df] sm:min-h-[380px] md:min-h-0",
                    image.className,
                  )}
                  key={image.alt}
                >
                  <Image
                    alt={image.alt}
                    className={image.imageClassName}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw"
                    src={image.src}
                  />
                </div>
              ))}
            </div>
          </section>
          </div>
        </Container>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}

function ValueIcon({ kind }: { kind: (typeof values)[number]["icon"] }) {
  if (kind === "together") {
    return (
      <svg aria-hidden className="size-5" fill="none" viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="16" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 17c.4-3 2-4.5 4.5-4.5s4.1 1.5 4.5 4.5M11.5 17c.4-3 2-4.5 4.5-4.5s4.1 1.5 4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    );
  }

  if (kind === "sparkle") {
    return (
      <svg aria-hidden className="size-5" fill="none" viewBox="0 0 24 24">
        <path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6ZM18 3v4M16 5h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      </svg>
    );
  }

  if (kind === "hanger") {
    return (
      <svg aria-hidden className="size-5" fill="none" viewBox="0 0 24 24">
        <path d="M10 7.25A2.25 2.25 0 1 1 12.4 9.5c-.25 1.55-1.1 2.3-2.9 3.2L4 16.25h16l-5.5-3.55" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="m4 15 6-6M8 18l8-8M14 18l6-6M4 10l3-3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}
