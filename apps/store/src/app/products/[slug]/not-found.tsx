import Link from "next/link";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { buttonClasses } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <>
      <StoreHeader />
      <main className="container-page py-12 md:py-16" id="main-content">
        <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center md:p-12">
          <p className="text-xs font-semibold uppercase leading-tight text-olive">
            Produk tidak ditemukan
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
            Produk ini belum tersedia
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-soft">
            Produk mungkin belum aktif atau tautannya sudah berubah. Jelajahi
            katalog untuk melihat produk Blissfy.co yang tersedia.
          </p>
          <Link
            className={buttonClasses({
              className: "mt-6",
              variant: "secondary",
            })}
            href="/products"
          >
            Lihat katalog
          </Link>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
