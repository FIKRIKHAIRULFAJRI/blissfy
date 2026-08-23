import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function ProductDetailLoading() {
  return (
    <>
      <StoreHeader />
      <main className="container-page py-8 md:py-14" id="main-content">
        <div className="mb-6 h-5 w-52 rounded-full bg-surface-muted" />
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <div className="aspect-[4/5] rounded-[var(--radius-xl)] bg-surface-muted" />
          <section>
            <div className="h-3 w-24 rounded-full bg-surface-muted" />
            <div className="mt-5 h-12 max-w-lg rounded-full bg-surface-muted" />
            <div className="mt-5 h-8 w-40 rounded-full bg-surface-muted" />
            <div className="mt-8 space-y-3">
              <div className="h-5 rounded-full bg-surface-muted" />
              <div className="h-5 max-w-md rounded-full bg-surface-muted" />
              <div className="h-5 max-w-sm rounded-full bg-surface-muted" />
            </div>
            <div className="mt-8 h-56 rounded-[var(--radius-lg)] bg-surface-muted" />
          </section>
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
