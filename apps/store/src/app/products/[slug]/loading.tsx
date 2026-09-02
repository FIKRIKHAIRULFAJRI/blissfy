import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function ProductDetailLoading() {
  return (
    <>
      <StoreHeader activePath="/products" variant="editorial" />
      <main
        aria-busy="true"
        aria-label="Loading product details"
        className="bg-bone"
        id="main-content"
      >
        <div className="container-page py-[30px] sm:py-9 lg:py-12">
          <div className="mx-auto max-w-[1200px] animate-pulse motion-reduce:animate-none">
            <span className="sr-only">Loading product details</span>
            <div className="mb-8 h-4 w-52 rounded-[5px] bg-black/10 lg:mb-12" />
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-16 xl:gap-24">
              <div className="aspect-[3/4] rounded-[5px] bg-black/10" />
              <section aria-hidden>
                <div className="h-3 w-24 rounded-[5px] bg-black/10" />
                <div className="mt-5 h-12 max-w-lg rounded-[5px] bg-black/10" />
                <div className="mt-5 h-7 w-40 rounded-[5px] bg-black/10" />
                <div className="mt-12 space-y-4">
                  <div className="h-11 rounded-[5px] bg-black/10" />
                  <div className="h-11 max-w-md rounded-[5px] bg-black/10" />
                  <div className="h-11 max-w-sm rounded-[5px] bg-black/10" />
                </div>
                <div className="mt-10 h-48 rounded-[5px] bg-black/10" />
              </section>
            </div>
          </div>
        </div>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
