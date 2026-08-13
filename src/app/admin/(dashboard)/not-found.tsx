import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
      <p className="text-sm font-semibold uppercase text-ink-muted">
        Tidak ditemukan
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-ink">
        Data admin yang dicari tidak ada.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-soft">
        Item katalog mungkin sudah dihapus atau URL yang dibuka tidak sesuai.
      </p>
      <Link
        className={buttonClasses({
          className: "mt-6 rounded-[var(--radius-md)]",
          variant: "secondary",
        })}
        href="/admin"
      >
        Kembali ke ringkasan
      </Link>
    </section>
  );
}
