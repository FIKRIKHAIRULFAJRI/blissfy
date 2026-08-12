import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { HeroCampaign } from "@/components/store/HeroCampaign";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import {
  featuredProducts,
  homeCollections,
  servicePromises,
} from "@/lib/placeholders";

export default function Home() {
  return (
    <>
      <StoreHeader />
      <main id="main-content">
        <HeroCampaign />

        <section className="container-page py-16 md:py-24" id="koleksi">
          <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              description="Pilihan awal dengan warna natural, harga jelas, dan detail yang mudah dipindai dari layar kecil."
              eyebrow="Koleksi awal"
              title="Baru dan trending"
            />
            <Link
              className={buttonClasses({
                className: "w-fit",
                variant: "secondary",
              })}
              href="/products"
            >
              Lihat semua produk
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="container-page">
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {homeCollections.map((collection) => (
              <article
                className="relative min-h-[360px] overflow-hidden rounded-[var(--radius-xl)] bg-surface-muted p-6 text-surface md:min-h-[430px] md:p-8"
                key={collection.id}
              >
                <div
                  aria-hidden
                  className={
                    collection.tone === "deep"
                      ? "absolute inset-0 bg-ink"
                      : "absolute inset-0 bg-taupe"
                  }
                />
                <div
                  aria-hidden
                  className="absolute bottom-0 right-0 h-4/5 w-3/5 rounded-tl-[6rem] bg-surface/18"
                />
                <div className="relative z-10 flex h-full min-h-[312px] flex-col justify-between md:min-h-[366px]">
                  <Badge
                    className="w-fit bg-surface/90 text-ink"
                    tone="neutral"
                  >
                    Koleksi
                  </Badge>
                  <div className="max-w-sm">
                    <h3 className="text-3xl font-semibold leading-tight md:text-4xl">
                      {collection.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-surface/80">
                      {collection.description}
                    </p>
                    <Link
                      className="mt-6 inline-flex min-h-11 items-center rounded-full border border-surface/80 px-5 text-sm font-semibold hover:bg-surface hover:text-ink"
                      href={collection.href}
                    >
                      Buka koleksi
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase leading-tight text-olive">
                Brand statement
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
                Potongan esensial, warna natural, dan alur belanja yang tetap
                sederhana dari awal sampai pembayaran.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[4/5] rounded-[var(--radius-lg)] bg-surface-muted" />
              <div className="mt-10 aspect-[4/5] rounded-[var(--radius-lg)] bg-olive/25" />
              <div className="aspect-[4/5] rounded-[var(--radius-lg)] bg-taupe/30" />
              <div className="mt-10 aspect-[4/5] rounded-[var(--radius-lg)] bg-border" />
            </div>
          </div>
        </section>

        <section className="container-page pb-16 md:pb-24">
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 md:p-8">
            <SectionHeading
              description="Setiap langkah belanja dibuat singkat, transparan, dan mudah diikuti tanpa membuat akun pelanggan."
              eyebrow="Layanan"
              title="Dirancang untuk transaksi yang jelas"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {servicePromises.map((promise) => (
                <article
                  className="rounded-[var(--radius-md)] bg-canvas p-5"
                  key={promise.title}
                >
                  <h3 className="text-base font-semibold text-ink">
                    {promise.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">
                    {promise.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
