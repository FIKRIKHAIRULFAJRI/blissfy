import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function CheckoutLoading() {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-12 lg:pb-[120px]">
          <div className="mx-auto max-w-[1200px] animate-pulse">
            <div className="h-12 w-48 rounded-[5px] bg-black/[0.06]" />
            <div className="mt-3 h-4 w-72 max-w-full rounded-[5px] bg-black/[0.05]" />
            <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
              <div className="space-y-8">
                <div className="h-72 rounded-[10px] border border-black/[0.06] bg-paper-white" />
                <div className="h-[520px] rounded-[10px] border border-black/[0.06] bg-paper-white" />
                <div className="h-64 rounded-[10px] border border-black/[0.06] bg-paper-white" />
                <div className="h-64 rounded-[10px] border border-black/[0.06] bg-paper-white" />
              </div>
              <div className="h-[520px] rounded-[10px] border border-black/[0.06] bg-paper-white" />
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
