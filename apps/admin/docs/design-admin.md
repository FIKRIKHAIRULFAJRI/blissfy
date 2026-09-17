# Blissfy.co — Admin Dashboard Design System
> Panel kerja operasional: sidebar gelap, kartu data padat, tabel dengan status badge berwarna, dan aksi cepat — dibangun untuk kecepatan mengelola katalog, stok, promosi, homepage, dan order, bukan untuk keindahan editorial.

**Theme:** light (surface terang, sidebar gelap sebagai kontras navigasi)
**Scope:** Admin Frontend (internal, butuh autentikasi). Referensi diambil dari template **Datta Able Free React Admin Template v3.2.0** yang kamu kirim (Bootstrap-based).
**Filosofi berbeda dari Store Frontend:** Storefront Blissfy memakai gaya editorial monokrom (lihat `design.md`). Admin **sengaja tidak** memakai gaya yang sama — admin adalah alat kerja, sehingga memakai palet semantik berwarna (biru/hijau/merah/kuning) supaya status stok, pembayaran, dan fulfillment bisa dikenali sekilas tanpa membaca teks.

---

## 1. Tokens — Warna

Diekstrak dari `_color-variables.scss` & `theme-variables.scss` pada template referensi.

### Warna Netral

| Name | Value | Peran |
|------|-------|-------|
| White | `#ffffff` | Background card, modal, tabel |
| Gray 100 | `#f8f9fa` | Hover row tabel |
| Gray 200 | `#f3f5f7` | Divider halus, table stripe |
| Gray 300 | `#dbe0e5` | Border input, border card |
| Gray 400 | `#bec8d0` | Placeholder icon, border disabled |
| Gray 500 | `#8996a4` | Teks helper/label sekunder |
| Gray 600 | `#5b6b79` | Teks body sekunder |
| Gray 700 | `#3e4853` | Teks body utama alternatif |
| Gray 800 | `#1d2630` | Heading gelap |
| Gray 900 | `#131920` | Teks paling gelap |
| Black | `#000000` | Jarang dipakai langsung |
| Body Background | `#f0f2f8` | Kanvas halaman di belakang card |

### Warna Semantik (status & aksi)

| Name | Value | Dipakai untuk |
|------|-------|----------------|
| Primary (Blue) | `#7267ef` | Aksi utama (tombol simpan, link aktif sidebar, tab aktif) |
| Secondary | `#6c757d` | Aksi sekunder/netral (tombol batal) |
| Success (Green) | `#17c666` | Badge **PAID**, **DELIVERED**, **Active**, stok aman |
| Danger (Red) | `#ea4d4d` | Badge **FAILED**, **CANCELLED**, **Out of Stock**, tombol hapus |
| Warning (Yellow/Orange) | `#ffa21d` | Badge **PENDING**, **WAITING_PAYMENT**, **Low Stock**, **PROCESSING** |
| Info (Cyan) | `#3ec9d6` | Badge **SHIPPED**, info netral, tag New Arrival di admin |
| Indigo | `#6610f2` | Aksen chart/grafik tambahan |
| Purple | `#9b59b6` | Aksen chart/grafik tambahan |
| Dark (Sidebar) | `#1c232f` | Background sidebar & brand header |
| Sidebar Brand BG | `#161c25` | Blok logo di sidebar |

**Konvensi badge status (soft/light variant)** — mengikuti pola template `light-success`, `light-warning`, `light-danger`, dst: background warna versi pucat (tint 80–90%) + teks warna solid. Ini dipakai di seluruh tabel Admin agar tidak terlalu "berteriak" tapi tetap jelas.

**Pemetaan status PRD → warna:**

| Domain | Status | Badge |
|--------|--------|-------|
| Payment | PENDING | Warning (light-warning) |
| Payment | PAID | Success (light-success) |
| Payment | EXPIRED | Secondary (light-secondary) |
| Payment | FAILED | Danger (light-danger) |
| Fulfillment | WAITING_PAYMENT | Warning |
| Fulfillment | PROCESSING | Info |
| Fulfillment | PACKED | Primary |
| Fulfillment | SHIPPED | Info (lebih gelap) |
| Fulfillment | DELIVERED | Success |
| Fulfillment | CANCELLED | Danger |
| Produk | Active / Published | Success |
| Produk | Archived | Secondary |
| Flash Sale / Discount / Voucher | Active | Success |
| Flash Sale / Discount / Voucher | Scheduled (belum mulai) | Info |
| Flash Sale / Discount / Voucher | Expired/Inactive | Secondary |
| Inventory | Stok Aman | Success |
| Inventory | Stok Menipis (di bawah threshold) | Warning |
| Inventory | Stok Habis | Danger |

---

## 2. Tokens — Tipografi

| Token | Value |
|-------|-------|
| Font family | `Inter, sans-serif` |
| Font size base | `14px` (0.875rem) |
| Font size small | `12.25px` |
| Font size large | `17.5px` |
| Weight regular | `400` |
| Weight semibold | `600` |
| Weight bold | `700` |

Panduan pemakaian:
- Page title (mis. "Manajemen Produk") → Inter 700, ~20–24px, Gray 900.
- Card title / section header ("Ringkasan Order Hari Ini") → Inter 600, 16px.
- Label tabel/kolom header → Inter 600, 12–13px, uppercase, Gray 600.
- Body/isi tabel → Inter 400, 14px, Gray 700.
- Angka besar pada stat card (KPI) → Inter 700, 24–28px.
- Helper text/caption (mis. "diperbarui 2 menit lalu") → Inter 400, 12px, Gray 500.

---

## 3. Tokens — Spacing, Radius & Shadow

| Elemen | Value |
|--------|-------|
| Border radius default | 4px |
| Border radius small (badge, tag) | 2px |
| Border radius large (modal, card besar) | 6–8px |
| Border radius pill (avatar, status dot) | 9999px |
| Card shadow | `0 2px 6px -1px rgba(0,0,0,0.1)` |
| Header shadow | `0 1px 20px 0 rgba(69,90,100,0.08)` |
| Sidebar shadow | `0 0 24px rgba(27,46,94,0.05)` |

**Layout**
- Sidebar width: 280px (collapsed: 100px, hanya ikon)
- Header height: 70px
- Card padding: 20–24px
- Gap antar card dalam grid: 16–24px
- Konten utama max-width: fluid (mengikuti viewport, dikurangi lebar sidebar)

---

## 4. Informasi Arsitektur (Halaman Admin — mapping ke PRD §6.15–6.17 & §6.1)

```text
/admin/login                      Login admin (autentikasi wajib)
/admin/dashboard                  Ringkasan (KPI, grafik, order terbaru)
/admin/products                   Daftar produk (search, filter status/kategori)
/admin/products/new               Form tambah produk + variant
/admin/products/:id/edit          Form edit produk, kelola gambar (Cloudinary), variant
/admin/inventory                  Daftar stok per variant, riwayat pergerakan stok
/admin/inventory/:variantId       Detail adjustment stok + alasan
/admin/orders                     Daftar order (filter status pembayaran/fulfillment)
/admin/orders/:id                 Detail order: item, payment, shipping, ubah status, input resi
/admin/promotions/discounts       Kelola regular discount
/admin/promotions/flash-sales     Kelola Flash Sale (pilih produk, harga, periode)
/admin/promotions/vouchers        Kelola voucher
/admin/homepage                   Kelola section homepage (urutan, aktif/nonaktif)
/admin/homepage/banners           Kelola banner (desktop/mobile image, jadwal tayang)
/admin/settings/store             Store settings (nama, alamat, shipping origin, kontak, berat default paket)
```

---

## 5. Components

### Sidebar Navigation
Background gelap `#1c232f`, lebar 280px, logo/brand block di atas dengan background lebih gelap `#161c25`. Menu dikelompokkan per section dengan judul grup kecil uppercase (Gray 500 di atas dark bg → dipakai warna terang `#778290`), item menu punya ikon + label, item aktif diberi warna Primary dan background highlight lembut. Menu collapsible untuk submenu (mis. "Promosi" → Discount/Flash Sale/Voucher). Sidebar bisa di-collapse jadi ikon saja (100px) untuk layar kecil.

Struktur grup menu untuk Blissfy:
```text
DASHBOARD
  Ringkasan

KATALOG
  Produk
  Variant & Stok

ORDER
  Semua Order

PROMOSI
  Discount
  Flash Sale
  Voucher

HOMEPAGE
  Section Homepage
  Banner

PENGATURAN
  Store Settings
```

### Top Header Bar
Background putih semi-transparan dengan shadow halus, tinggi 70px. Kiri: breadcrumb halaman aktif. Kanan: search cepat (cari produk/order), ikon notifikasi (mis. "3 order baru menunggu diproses"), avatar admin + dropdown (profil, logout).

### Stat / KPI Card (Flat Card)
Card putih, radius 4–6px, shadow tipis. Grid 3–4 kolom berisi angka besar (Inter 700, 24px) + label + ikon kecil di kiri. Dipakai di Dashboard untuk: Order Hari Ini, Order Menunggu Pembayaran, Revenue Hari Ini/Bulan Ini, Produk Stok Menipis, Flash Sale Aktif.

### Data Table
Header kolom uppercase kecil, Gray 600. Baris zebra ringan (hover → Gray 100). Kolom umum: gambar thumbnail (avatar kotak kecil, radius 4px), nama/kode, **Status** (badge soft-color sesuai pemetaan §1), nilai (harga/stok/total), kolom **Aksi** berisi ikon edit (pensil, warna primary/success) dan hapus/arsip (ikon trash, warna danger) — bukan tombol teks, agar tabel ringkas. Pagination di bawah tabel. Search + filter dropdown (status, kategori, gender, rentang tanggal) di atas tabel.

**Tabel spesifik Blissfy:**
- **Tabel Produk**: Thumbnail, Nama, Kategori, Gender, Harga Normal, Status Promo (Flash Sale/Discount/-), Total Stok (agregat semua variant), Status (Active/Archived), Aksi.
- **Tabel Variant** (di dalam halaman edit produk, sub-tabel): Color, Size, SKU, Weight, Stock, Status.
- **Tabel Inventory Movement**: Tanggal, Variant, Tipe (masuk/keluar/adjustment), Jumlah, Alasan, Referensi (order id bila otomatis), Admin yang melakukan.
- **Tabel Order**: No. Order, Nama Pelanggan, Total, Status Pembayaran (badge), Status Fulfillment (badge), Tanggal, Aksi (lihat detail).
- **Tabel Voucher/Discount/Flash Sale**: Kode/Nama, Tipe (%/nominal atau harga tetap untuk Flash Sale), Periode Mulai–Selesai, Status (badge Active/Scheduled/Expired), Penggunaan (khusus voucher), Aksi.

### Form (Create/Edit Product, dsb.)
Layout dua kolom pada layar lebar: kolom kiri form input utama, kolom kanan panel pendukung (preview gambar, ringkasan status). Input standar Bootstrap: label di atas, border radius 4px, border Gray 300, focus state border Primary. Grup field terkait dikelompokkan dalam Card terpisah dengan judul (mis. Card "Informasi Umum", Card "Material & Perawatan", Card "Gambar Produk", Card "Variant").

**Form Produk mengikuti data model PRD §7.1 & §6.2:**
Name, Slug (auto-generate, bisa diedit), Description (textarea/rich text sederhana), Gender (select: Men/Women/Unisex), Category (select), Material, Fit, Pattern, Care Instruction (textarea), Size Guide (upload gambar/teks), Normal Price (input angka format Rupiah), toggle Active/Archived. Field `sold_count` **read-only**, ditampilkan sebagai info bukan input (PRD: "Admin tidak bebas mengubah angka sold count").

**Panel Gambar Produk**: grid thumbnail upload (Cloudinary signed upload), drag-to-reorder, tombol "Jadikan Utama" pada gambar, indikator upload gagal + tombol retry.

**Panel Variant**: tabel editable inline (tambah baris baru untuk kombinasi color+size), input SKU/weight/stock per baris, validasi SKU unik.

**Toggle New Arrival / Best Seller**: switch on/off sederhana di Card "Merchandising", sesuai PRD §6.6 (manual, bukan otomatis).

### Flash Sale Form
Card dengan: pemilih produk (multi-select/search produk, menampilkan preview harga normal), input Flash Sale Price (satu harga berlaku untuk semua variant — beri catatan inline "Berlaku untuk seluruh variant produk terpilih"), Start/End datetime picker, toggle Active/Inactive. Preview di sisi kanan menampilkan daftar variant yang akan terdampak beserta harga barunya (sesuai contoh PRD §6.8).

### Order Detail Page
Header: No. Order + badge status pembayaran & fulfillment berdampingan. Section: Info Pelanggan (nama, WA, email, alamat lengkap), Daftar Item (snapshot produk/variant/harga saat order dibuat — bukan data produk live), Ringkasan Pembayaran (subtotal, discount, voucher, ongkir, grand total), Info Pengiriman (kurir, service, ongkir, resi — field resi editable oleh admin), dropdown untuk mengubah **fulfillment status** (mengikuti alur WAITING_PAYMENT → PROCESSING → PACKED → SHIPPED → DELIVERED / CANCELLED, tidak bisa lompat mundur), log riwayat perubahan status di bagian bawah.

### Homepage & Banner Management
Daftar section homepage (Hero Banner, Flash Sale, New Arrivals, Best Sellers, Sale, Featured Products, Men, Women) ditampilkan sebagai list dengan drag handle untuk reorder (menjawab Open Question §10.10 — desain mendukung reorder), toggle Active/Inactive per section. Form Banner: upload gambar desktop & mobile terpisah (preview side-by-side), Title, Subtitle, CTA text, Target link, Start/End datetime, toggle Active.

### Modal / Dialog
Radius 6–8px, shadow lebih tebal dari card biasa, dipakai untuk konfirmasi aksi destruktif (arsip produk, hapus voucher) dan form cepat (adjustment stok). Tombol aksi: kiri "Batal" (outline/secondary), kanan tombol solid sesuai konteks (Primary untuk simpan, Danger untuk konfirmasi hapus).

### Tabs
Dipakai di halaman edit produk untuk memisahkan "Informasi Umum / Variant & Stok / Gambar / SEO & Merchandising" dalam satu halaman tanpa reload. Tab aktif bergaris bawah warna Primary.

### Empty & Loading States
Tabel kosong → ilustrasi ringan + teks ("Belum ada produk, tambahkan produk pertama") + CTA. Loading → skeleton row pada tabel, spinner Primary pada tombol saat submit form.

---

## 6. Do's and Don'ts

### Do
- Pakai badge soft-color (`light-success`, `light-warning`, `light-danger`, dst.) secara konsisten untuk semua status di seluruh modul (payment, fulfillment, promo, stok) — ini adalah bahasa visual utama admin.
- Kelompokkan field form panjang (produk, variant, gambar) ke dalam Card terpisah dengan judul jelas, agar form panjang tetap scannable.
- Tampilkan `sold_count` sebagai info read-only, jangan pernah sebagai input yang bisa diedit admin.
- Sediakan konfirmasi modal untuk setiap aksi destruktif atau yang berdampak transaksi (archive produk, ubah harga Flash Sale, ubah status order mundur).
- Gunakan satu warna Primary konsisten untuk semua aksi utama (tombol simpan, link aktif) di seluruh modul.

### Don't
- Jangan gunakan gaya monokrom storefront (`design.md`) di admin — admin butuh differensiasi warna status yang cepat dibaca, bukan estetika editorial.
- Jangan izinkan admin mengubah `sold_count`, atau membuat stock reservation manual di luar alur inventory movement.
- Jangan tampilkan tombol "Ubah Fulfillment Status" yang membolehkan lompat mundur status (mis. dari SHIPPED kembali ke PROCESSING) tanpa jalur pembatalan eksplisit.
- Jangan gabungkan form create Flash Sale dengan Regular Discount dalam satu layar — keduanya punya aturan prioritas berbeda (PRD §6.8) dan harus terlihat sebagai entitas terpisah.
- Jangan sembunyikan riwayat inventory movement — setiap penambahan/pengurangan stok harus tercatat & terlihat (audit trail), sesuai PRD §6.16.

---

## 7. Quick Start — CSS Tokens

```css
:root {
  /* Neutral */
  --admin-white: #ffffff;
  --admin-body-bg: #f0f2f8;
  --admin-gray-100: #f8f9fa;
  --admin-gray-200: #f3f5f7;
  --admin-gray-300: #dbe0e5;
  --admin-gray-400: #bec8d0;
  --admin-gray-500: #8996a4;
  --admin-gray-600: #5b6b79;
  --admin-gray-700: #3e4853;
  --admin-gray-800: #1d2630;
  --admin-gray-900: #131920;

  /* Semantic */
  --admin-primary: #7267ef;
  --admin-secondary: #6c757d;
  --admin-success: #17c666;
  --admin-danger: #ea4d4d;
  --admin-warning: #ffa21d;
  --admin-info: #3ec9d6;

  /* Sidebar */
  --admin-sidebar-bg: #1c232f;
  --admin-sidebar-brand-bg: #161c25;
  --admin-sidebar-color: #ced4dc;
  --admin-sidebar-icon-color: #778290;

  /* Typography */
  --admin-font-family: 'Inter', sans-serif;
  --admin-font-size-base: 14px;
  --admin-font-size-sm: 12.25px;
  --admin-font-size-lg: 17.5px;
  --admin-font-weight-regular: 400;
  --admin-font-weight-semibold: 600;
  --admin-font-weight-bold: 700;

  /* Radius */
  --admin-radius: 4px;
  --admin-radius-sm: 2px;
  --admin-radius-lg: 6px;
  --admin-radius-xl: 8px;
  --admin-radius-pill: 9999px;

  /* Shadow */
  --admin-card-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.1);
  --admin-header-shadow: 0 1px 20px 0 rgba(69, 90, 100, 0.08);
  --admin-sidebar-shadow: 0 0 24px rgba(27, 46, 94, 0.05);

  /* Layout */
  --admin-sidebar-width: 280px;
  --admin-sidebar-collapsed-width: 100px;
  --admin-header-height: 70px;
}
```

---

## 8. Catatan Keterkaitan dengan PRD

- Struktur menu Admin (Katalog, Order, Promosi, Homepage, Pengaturan) memetakan langsung ke PRD §6.15–6.17 dan §6.1 (homepage management).
- Badge status payment & fulfillment memakai nilai enum persis dari PRD §6.13 dan §6.17 (PENDING/PAID/EXPIRED/FAILED, WAITING_PAYMENT/PROCESSING/PACKED/SHIPPED/DELIVERED/CANCELLED) — tidak ada status tambahan yang direkayasa di UI.
- Form Flash Sale secara desain mencegah admin mengatur harga per-variant, sesuai aturan "satu harga Flash Sale berlaku untuk seluruh variant" (PRD §6.8 & Final Product Boundary).
- Reorder section homepage disediakan sebagai jawaban desain terhadap Open Question §10.10 — namun implementasi tetap menunggu keputusan final di PRD.
- Autentikasi Admin (login page) wajib ada sesuai Definition of Done ("Admin API mengembalikan unauthorized/forbidden" bila tidak terautentikasi) — desain login memakai pola halaman auth standar dari template referensi (card terpusat, tanpa sidebar).
