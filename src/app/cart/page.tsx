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
      <StoreHeader />
      <main className="container-page py-10 md:py-14" id="main-content">
        <CartView />
      </main>
      <StoreFooter />
    </>
  );
}
