import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { buttonClasses } from "@/components/ui/button";
import { getCatalogProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Produk | Blissfy.co",
  description:
    "Jelajahi katalog fashion Blissfy.co dengan harga, diskon, warna, ukuran, dan stok ready stock.",
};

export default async function ProductsPage() {
  const products = await getCatalogProducts();

  return (
    <>
      <StoreHeader />
      <main className="container-page py-12 md:py-16" id="main-content">
        <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            description="Semua produk aktif menampilkan harga integer Rupiah, gambar lokal, warna, dan status ready stock dari database."
            eyebrow="Katalog"
            title="Semua produk"
          />
          <p className="text-sm font-medium text-ink-muted">
            {products.length} produk aktif
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center md:p-12">
            <h2 className="text-2xl font-semibold text-ink">
              Katalog belum tersedia
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-soft">
              Produk aktif akan muncul setelah kategori, produk, gambar, varian,
              dan stok ready stock tersedia di database.
            </p>
            <Link
              className={buttonClasses({
                className: "mt-6",
                variant: "secondary",
              })}
              href="/"
            >
              Kembali ke beranda
            </Link>
          </section>
        )}
      </main>
      <StoreFooter />
    </>
  );
}
