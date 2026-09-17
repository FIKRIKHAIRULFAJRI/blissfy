import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function PaymentLoading() {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone" id="main-content">
        <div className="container-page py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-[460px] animate-pulse rounded-[10px] border border-black/[0.06] bg-paper-white px-5 py-8 sm:px-9 sm:py-10">
            <div className="mx-auto h-3 w-44 rounded-[3px] bg-black/[0.06]" />
            <div className="mx-auto mt-7 h-14 w-40 rounded-[5px] bg-black/[0.06]" />
            <div className="mx-auto mt-5 h-4 w-36 rounded-[3px] bg-black/[0.05]" />
            <div className="mx-auto mt-8 h-8 w-32 rounded-[4px] bg-black/[0.06]" />
            <div className="mt-9 h-[370px] rounded-[6px] border border-black/[0.06] bg-black/[0.03]" />
            <div className="mt-7 h-64 rounded-[6px] border border-black/[0.06] bg-black/[0.03]" />
            <div className="mt-7 h-12 rounded-[5px] bg-black/[0.08]" />
          </div>
        </div>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
