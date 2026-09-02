import Image from "next/image";
import Link from "next/link";

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
      className="relative isolate min-h-[clamp(560px,90vw,680px)] overflow-hidden bg-black text-white min-[901px]:min-h-[clamp(680px,calc(100svh-80px),980px)] [&_a:focus-visible]:outline-white"
    >
      <div className="absolute inset-0 -z-20 overflow-hidden bg-cocoa">
        <Image
          alt={image.altText}
          className="object-cover object-[center_34%]"
          fill
          priority
          sizes="100vw"
          src={image.url}
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.20)_0%,rgba(0,0,0,0.38)_52%,rgba(0,0,0,0.62)_100%)]"
      />

      <div className="mx-auto flex min-h-[inherit] w-[calc(100%-40px)] max-w-[1320px] items-center justify-center px-5 py-12 min-[901px]:w-[calc(100%-48px)] min-[901px]:px-0 min-[901px]:py-24">
        <div className="flex max-w-[720px] flex-col items-center text-center">
          <h1
            className="font-goudy-old-style text-[40px] font-normal leading-[1.02] tracking-[-0.012em] max-[360px]:text-4xl min-[901px]:text-[clamp(2.75rem,4vw,3.5rem)]"
            id="homepage-hero-heading"
          >
            Shared or solo, still Blissfy
          </h1>
          <p className="mt-6 max-w-[560px] text-base leading-normal text-white/75">
            Curated simplicity for the discerning individual. Discover our
            latest collection of modern minimalist essentials.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[5px] border border-white bg-white px-4 py-[9px] text-[13px] font-medium uppercase tracking-[0.06em] text-black transition-colors duration-200 hover:bg-transparent hover:text-white focus-visible:outline-white motion-reduce:transition-none"
            href="/products"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
