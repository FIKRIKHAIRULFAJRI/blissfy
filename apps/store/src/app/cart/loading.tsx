import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function CartLoading() {
  return (
    <>
      <StoreHeader />
      <main className="container-page py-10 md:py-14" id="main-content">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                className="h-44 animate-pulse rounded-[var(--radius-xl)] bg-surface-muted"
                key={item}
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[var(--radius-xl)] bg-surface-muted" />
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
