import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Akses Ditolak | Blissfy.co",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <section className="w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold uppercase text-danger">
          Unauthorized
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">
          Akun ini tidak punya akses admin.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Session admin tidak valid, sudah kedaluwarsa, atau akun admin tidak
          ditemukan di tabel admin_users.
        </p>
        <Link
          className={buttonClasses({
            className: "mt-6 rounded-[var(--radius-md)]",
            variant: "secondary",
          })}
          href="/admin/login"
        >
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}
