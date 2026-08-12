import type { Collection, Product, ServicePromise } from "@/types/store";

export const featuredProducts: Product[] = [
  {
    id: "prd-relaxed-shirt",
    name: "Relaxed Linen Shirt",
    slug: "relaxed-linen-shirt",
    category: "Atasan",
    price: 189000,
    imageTone: "ivory",
    colors: [
      { name: "Ivory", value: "#ECE5D8" },
      { name: "Olive", value: "#6F7254" },
      { name: "Charcoal", value: "#2B2B27" },
    ],
  },
  {
    id: "prd-easy-trouser",
    name: "Easy Straight Trouser",
    slug: "easy-straight-trouser",
    category: "Bawahan",
    price: 229000,
    imageTone: "stone",
    colors: [
      { name: "Stone", value: "#B9B4A8" },
      { name: "Taupe", value: "#A59A86" },
    ],
  },
  {
    id: "prd-soft-outer",
    name: "Soft Utility Outer",
    slug: "soft-utility-outer",
    category: "Outerwear",
    price: 279000,
    imageTone: "olive",
    colors: [
      { name: "Olive", value: "#6F7254" },
      { name: "Sand", value: "#D6C9B7" },
      { name: "Black", value: "#171713" },
    ],
  },
  {
    id: "prd-daily-knit",
    name: "Daily Fine Knit",
    slug: "daily-fine-knit",
    category: "Essentials",
    price: 169000,
    imageTone: "taupe",
    colors: [
      { name: "Taupe", value: "#A59A86" },
      { name: "Cream", value: "#F4EFE4" },
    ],
  },
];

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
