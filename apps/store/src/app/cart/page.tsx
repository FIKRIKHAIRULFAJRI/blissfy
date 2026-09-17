import type { Metadata } from "next";
import { CartView } from "@/components/store/CartView";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export const metadata: Metadata = {
  title: "Keranjang | Blissfy.co",
  description:
    "Periksa produk, varian, jumlah, harga, diskon, dan subtotal sebelum checkout.",
};

export default function CartPage() {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-12 lg:pb-[120px] lg:pt-16">
          <CartView />
        </div>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
