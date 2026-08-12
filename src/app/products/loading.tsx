import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function ProductsLoading() {
  return (
    <>
      <StoreHeader />
      <main className="container-page py-12 md:py-16" id="main-content">
        <div className="mb-10 max-w-3xl">
          <div className="h-3 w-24 rounded-full bg-surface-muted" />
          <div className="mt-5 h-10 w-64 rounded-full bg-surface-muted" />
          <div className="mt-5 h-5 max-w-xl rounded-full bg-surface-muted" />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="space-y-4" key={index}>
              <div className="aspect-[4/5] rounded-[var(--radius-lg)] bg-surface-muted" />
              <div className="h-4 w-24 rounded-full bg-surface-muted" />
              <div className="h-5 w-40 rounded-full bg-surface-muted" />
            </div>
          ))}
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
