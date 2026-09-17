import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function CartLoading() {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main
        aria-busy="true"
        aria-label="Loading cart"
        className="bg-bone text-black"
        id="main-content"
      >
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-12 lg:pb-[120px] lg:pt-16">
          <div className="mx-auto max-w-[1200px] animate-pulse motion-reduce:animate-none">
            <span className="sr-only">Loading cart</span>
            <div className="h-10 w-44 rounded-[5px] bg-black/[0.08]" />
            <div className="mt-8 h-20 rounded-[8px] border border-black/10 bg-paper-white" />

            <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
              <div className="space-y-4">
                {[0, 1].map((item) => (
                  <div
                    className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-[10px] border border-black/[0.06] bg-paper-white p-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6 sm:p-6"
                    key={item}
                  >
                    <div className="aspect-square rounded-[8px] bg-black/[0.07]" />
                    <div>
                      <div className="h-7 w-52 max-w-full rounded-[5px] bg-black/[0.08]" />
                      <div className="mt-3 h-3 w-24 rounded-[5px] bg-black/[0.06]" />
                      <div className="mt-5 h-5 w-32 rounded-[5px] bg-black/[0.08]" />
                      <div className="mt-8 h-11 w-[132px] rounded-[5px] bg-black/[0.07]" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-[500px] rounded-[10px] border border-black/[0.06] bg-paper-white" />
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
