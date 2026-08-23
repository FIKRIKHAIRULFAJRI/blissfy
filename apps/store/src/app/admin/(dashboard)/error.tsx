"use client";

import { buttonClasses } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-bg p-6">
      <p className="text-sm font-semibold uppercase text-danger">
        Gagal memuat
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-ink">
        Dashboard admin belum bisa ditampilkan.
      </h1>
      <p className="mt-3 text-sm leading-6 text-danger">
        {error.message || "Terjadi kesalahan saat mengambil data admin."}
      </p>
      <button
        className={buttonClasses({
          className: "mt-5 rounded-[var(--radius-md)]",
          variant: "secondary",
        })}
        onClick={reset}
        type="button"
      >
        Coba lagi
      </button>
    </section>
  );
}
