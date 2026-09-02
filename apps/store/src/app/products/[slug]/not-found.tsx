import Link from "next/link";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { storeButtonClasses } from "@/components/store/ui/StoreButton";

export default function ProductNotFound() {
  return (
    <>
      <StoreHeader activePath="/products" variant="editorial" />

      <main className="bg-bone" id="main-content">
        <section className="container-page max-w-[1200px] py-[72px] text-center md:py-24">
          <div className="rounded-[5px] border border-black/10 bg-paper-white p-8 md:p-12">
          <p className="text-[11px] font-medium uppercase leading-tight tracking-[0.1em] text-stone">
            Produk tidak ditemukan
          </p>

          <h1 className="mt-4 font-goudy-old-style text-[32px] font-normal leading-[1.08] text-black md:text-[40px]">
            Produk ini belum tersedia
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.6] text-stone">
            Produk mungkin belum aktif atau tautannya sudah berubah. Jelajahi
            katalog untuk melihat produk Blissfy.co yang tersedia.
          </p>

          <Link
            className={storeButtonClasses({
              className:
                "mt-6 rounded-[5px] border-cocoa bg-cocoa text-white hover:bg-black",
              variant: "primary",
            })}
            href="/products"
          >
            Lihat katalog
          </Link>
          </div>
        </section>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
