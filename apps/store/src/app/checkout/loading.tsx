import Link from "next/link";
import { StoreFooter } from "@/components/store/StoreFooter";

export default function CheckoutLoading() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <Link className="text-xl font-semibold text-ink" href="/">
            Blissfy.co
          </Link>
          <span className="text-sm font-semibold text-ink-soft">
            Checkout aman
          </span>
        </div>
      </header>
      <main className="container-page py-10 md:py-14" id="main-content">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="h-[760px] animate-pulse rounded-[var(--radius-xl)] bg-surface-muted" />
          <div className="h-96 animate-pulse rounded-[var(--radius-xl)] bg-surface-muted" />
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
