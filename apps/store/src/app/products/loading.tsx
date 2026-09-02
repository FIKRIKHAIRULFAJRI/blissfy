import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function ProductsLoading() {
  return (
    <>
      <StoreHeader activePath="/products" variant="editorial" />
      <main
        aria-busy="true"
        aria-label="Loading products"
        className="bg-bone text-black"
        id="main-content"
      >
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-9 lg:pb-[120px] lg:pt-12">
          <div className="mx-auto max-w-[1200px] animate-pulse motion-reduce:animate-none">
            <span className="sr-only">Loading product catalog</span>

            <div className="h-3 w-28 rounded-[5px] bg-black/[0.08]" />

            <div className="mt-[30px] border-b border-black/10 pb-[30px] md:mt-12 md:flex md:items-end md:justify-between md:gap-6 md:pb-12">
              <div>
                <div className="h-12 w-64 max-w-full rounded-[5px] bg-black/[0.08] sm:h-16 sm:w-[360px]" />
                <div className="mt-[18px] h-4 w-[520px] max-w-full rounded-[5px] bg-black/[0.06]" />
              </div>
              <div className="mt-[18px] h-3 w-20 rounded-[5px] bg-black/[0.06] md:mt-0 md:mb-1" />
            </div>

            <div className="mt-[30px] lg:mt-12 lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-12">
              <aside aria-hidden className="hidden lg:block">
                <div className="h-7 w-24 rounded-[5px] bg-black/[0.08]" />
                <div className="mt-[18px] grid gap-3">
                  <div className="h-3 w-28 rounded-[5px] bg-black/[0.06]" />
                  <div className="h-3 w-14 rounded-[5px] bg-black/[0.06]" />
                  <div className="h-3 w-16 rounded-[5px] bg-black/[0.06]" />
                  <div className="h-3 w-20 rounded-[5px] bg-black/[0.06]" />
                </div>
                <div className="mt-[42px] h-7 w-24 rounded-[5px] bg-black/[0.08]" />
                <div className="mt-[18px] grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div className="flex items-center gap-3" key={index}>
                      <div className="size-4 rounded-[3px] bg-black/[0.08]" />
                      <div className="h-3 w-16 rounded-[5px] bg-black/[0.06]" />
                    </div>
                  ))}
                </div>
              </aside>

              <section aria-hidden>
                <div className="flex items-center justify-between gap-4">
                  <div className="h-[52px] w-full rounded-[5px] border border-black/10 bg-paper-white lg:max-w-[340px]" />
                  <div className="hidden h-4 w-52 rounded-[5px] bg-black/[0.06] lg:block" />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-[30px] sm:mt-[30px] sm:gap-x-4 sm:gap-y-9 lg:mt-8 lg:grid-cols-3 lg:gap-x-[18px] lg:gap-y-12">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index}>
                      <div className="aspect-[3/4] rounded-[5px] bg-black/[0.07]" />
                      <div className="mt-3 h-3 w-20 rounded-[5px] bg-black/[0.06] sm:mt-4" />
                      <div className="mt-2 h-6 w-36 max-w-full rounded-[5px] bg-black/[0.08]" />
                      <div className="mt-3 h-3 w-24 rounded-[5px] bg-black/[0.06]" />
                    </div>
                  ))}
                </div>
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
