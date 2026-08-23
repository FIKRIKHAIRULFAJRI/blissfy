import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function PaymentNotFound() {
  return (
    <main className="container-page py-16" id="main-content">
      <section className="mx-auto max-w-xl rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center">
        <p className="text-xs font-semibold uppercase text-danger">
          Pesanan tidak ditemukan
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">
          Tautan pembayaran tidak valid
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Nomor pesanan saja tidak cukup untuk membuka detail. Gunakan tautan
          rahasia yang diberikan setelah checkout berhasil.
        </p>
        <Link className={buttonClasses({ className: "mt-6" })} href="/cart">
          Kembali ke keranjang
        </Link>
      </section>
    </main>
  );
}
