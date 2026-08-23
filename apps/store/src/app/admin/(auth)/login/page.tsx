import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { loginAdmin } from "../../auth-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login Admin | Blissfy.co",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const session = await getCurrentAdmin();
  const params = await searchParams;

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-menu)]">
        <Link className="text-2xl font-semibold text-ink" href="/">
          Blissfy.co
        </Link>
        <p className="mt-2 text-sm font-medium text-ink-muted">
          Dashboard admin katalog
        </p>

        <div className="mt-6">
          <AdminNotice error={params?.error} notice={params?.notice} />
        </div>

        <form action={loginAdmin} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-ink" htmlFor="email">
              Email admin
            </label>
            <input
              autoComplete="email"
              className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="password"
            >
              Password
            </label>
            <input
              autoComplete="current-password"
              className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className={buttonClasses({
              className: "w-full rounded-[var(--radius-md)]",
            })}
            type="submit"
          >
            Masuk ke dashboard
          </button>
        </form>

        <p className="mt-6 text-sm leading-6 text-ink-muted">
          Login memakai kredensial dari tabel admin_users. Password sebaiknya
          disimpan sebagai hash, bukan plaintext.
        </p>
      </section>
    </main>
  );
}
