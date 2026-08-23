import type { Collection, ServicePromise } from "@/types/store";

export const homeCollections: Collection[] = [
  {
    id: "everyday",
    title: "Everyday essentials",
    description: "Potongan bersih untuk rutinitas harian yang tetap terasa rapi.",
    href: "#koleksi",
    tone: "warm",
  },
  {
    id: "weekend",
    title: "Weekend layers",
    description: "Layer ringan dengan warna natural untuk tampilan santai.",
    href: "#koleksi",
    tone: "deep",
  },
];

export const servicePromises: ServicePromise[] = [
  {
    title: "Pengiriman Indonesia",
    description: "Pilihan kurir berfokus pada J&T dan JNE untuk tujuan nasional.",
  },
  {
    title: "Pembayaran QRIS",
    description: "Pembayaran dirancang memakai QRIS dinamis dengan batas waktu jelas.",
  },
  {
    title: "Belanja tanpa akun",
    description: "Checkout dirancang untuk pelanggan tamu tanpa proses registrasi.",
  },
];

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "");
}
