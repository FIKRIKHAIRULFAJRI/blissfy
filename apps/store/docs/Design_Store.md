# Blissfy.co — Storefront Design System
> Editorial lookbook di atas kanvas putih. Fashion single-store dengan tipografi tenang, foto produk sebagai warna utama, dan UI yang "menghilang" agar pakaian yang berbicara — dibangun untuk alur belanja cepat tanpa akun: browse → pilih variant → cart → checkout tamu → QRIS → tracking.

**Theme:** light
**Scope:** Store Frontend (Customer-facing). Admin Dashboard **tidak** termasuk dalam dokumen ini — akan dibuat terpisah.

Blissfy mengadopsi arah visual near-monochrome ala editorial lookbook: permukaan putih, tinta hitam, satu typeface (Favorit) untuk seluruh UI, dan warna netral (Warm Fog, Blush Sand, Pale Tide) hanya sebagai banding section — bukan warna brand yang mencolok. Karena produk memiliki banyak status harga (normal, discount, Flash Sale), sistem desain ini sengaja menjaga chrome tetap netral supaya label harga & badge promo yang justru menonjol lewat tipografi (bukan lewat warna terang). Komponen flat, tanpa shadow, hairline 1px sebagai pembatas, radius 0px untuk kartu/gambar dan 4px untuk tombol/input.

---

## 1. Tokens — Warna

Diambil langsung dari `theme.css`. Peran warna disesuaikan dengan kebutuhan storefront Blissfy (bukan activewear seperti referensi asal).

| Name | Value | Token | Peran di Blissfy |
|------|-------|-------|-------------------|
| Carbon Ink | `#000000` | `--color-carbon-ink` | Teks utama, tombol filled (Add to Cart, Bayar Sekarang), hairline, ikon |
| Paper White | `#ffffff` | `--color-paper-white` | Kanvas halaman, kartu produk, permukaan form checkout |
| Soft Mist | `#e5e7eb` | `--color-soft-mist` | Skeleton loading, divider antar section, background disabled variant |
| Warm Fog | `#f0efe7` | `--color-warm-fog` | Banding antar section homepage (mis. antara Flash Sale dan New Arrivals) |
| Blush Sand | `#f5ebd5` | `--color-blush-sand` | Background section **Sale** / promo editorial di homepage |
| Smoke Charcoal | `#333333` | `--color-smoke-charcoal` | Teks sekunder (deskripsi, meta info), border input |
| Onyx | `#1d1d1d` | `--color-onyx` | Border elevated surface (mis. drawer cart), teks pada background gelap |
| Stone Gray | `#cccccc` | `--color-stone-gray` | Placeholder gambar, swatch default, teks disabled |
| Slate | `#2f3440` | `--color-slate` | Background foto produk studio (jika diperlukan untuk banner) |
| Olive Drab | `#636355` | `--color-olive-drab` | Alternatif background editorial (jarang dipakai) |
| Maroon Clay | `#523037` | `--color-maroon-clay` | Alternatif background editorial (jarang dipakai) |
| Deep Iris | `#222845` | `--color-deep-iris` | Alternatif background editorial (jarang dipakai) |
| Pewter | `#677284` | `--color-pewter` | Ikon/teks pada context foto gelap |
| Driftwood | `#dfccbe` | `--color-driftwood` | Warm accent tambahan untuk section Men/Women divider |
| Pale Tide | `#badce4` | `--color-pale-tide` | Background badge/section **New Arrivals** |

**Aturan warna status (order tracking & stok):**
Karena palet dijaga near-monochrome, status **tidak** memakai warna sinyal (merah/hijau/kuning). Gunakan:
- Selesai/aktif → Carbon Ink solid (filled dot / filled text)
- Belum selesai/nonaktif → Stone Gray outline
- Peringatan (mis. "Stok tersisa 2", "Sesi pembayaran akan berakhir") → teks Carbon Ink + underline atau bold, bukan warna merah.
- Pengecualian tunggal yang diperbolehkan: teks error validasi form boleh memakai `#523037` (Maroon Clay) sebagai penekanan lembut, tetap bukan merah murni.

---

## 2. Tokens — Tipografi

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|-----------------|-------|
| body | 14px | 1.33 | 0.35px | `--text-body` |
| heading | 20px | 1.2 | 0.5px | `--text-heading` |
| display | 30px | 1.2 | 0.75px | `--text-display` |

**Favorit** (`--font-favorit`) — typeface tunggal untuk seluruh UI: nav, heading section homepage, nama produk, harga, tombol, input, tab kategori. Weight 400/500/700. Substitute: Inter.

**Nunito Sans** (`--font-nunito-sans`) — fallback untuk elemen form minor (placeholder halus, helper text kecil).

Panduan pemakaian di Blissfy:
- Wordmark "BLISSFY" di nav → Favorit 700, 20–30px, tracking 0.5–0.75px.
- Judul section homepage ("Flash Sale", "New Arrivals", "Best Sellers") → Favorit 700, 20px.
- Nama produk di card & detail → Favorit 400, 14px.
- Harga normal (coret) & harga promo → Favorit 500, 14px; harga Flash Sale sedikit lebih besar (16px, 500) agar terlihat sebagai fokus utama.
- Label kategori/gender tab (MEN/WOMEN/UNISEX) → Favorit 500, 12px, uppercase.
- Sold count ("986 terjual") → Favorit 400, 12px, Smoke Charcoal — informatif, bukan penekanan.

---

## 3. Tokens — Spacing & Bentuk

**Base unit:** 4px · **Density:** compact

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |

**Border Radius**

| Elemen | Value |
|--------|-------|
| tags / badge (New, Best Seller, Flash Sale) | 0px |
| product card / image | 0px |
| input & search bar | 4px |
| button | 4px |
| voucher chip | 4px |

**Layout**
- Page max-width: 1440px
- Section gap (homepage): 64px
- Card padding: 16px
- Element gap (dalam card/form): 8px
- Product grid: 4 kolom desktop, 2 kolom mobile, gap 16px kolom / 24px baris (dipadatkan dari referensi 64px agar tetap ringkas di single-store kecil–menengah).

---

## 4. Informasi Arsitektur (Halaman MVP)

```text
/                         Homepage
/men /women /unisex       Listing per gender
/category/:slug           Listing per kategori (dapat dikombinasi dengan gender via query filter)
/search?q=                Hasil pencarian
/product/:slug            Product Detail
/cart                     Cart (drawer di desktop, full page di mobile)
/checkout                 Guest checkout (contact → address → shipping → review)
/checkout/payment         QRIS payment screen
/order/track/:token       Order tracking (secure access token)
```

Tidak ada halaman login/register/akun (non-goal MVP). Ikon "akun" pada nav referensi Adanola **dihapus**; digantikan ikon "Lacak Pesanan".

---

## 5. Components

### Top Navigation Bar
White background, hairline 1px `#000000` bottom border. Kiri: link gender/kategori (MEN, WOMEN, UNISEX) Favorit 12px/500. Tengah: wordmark "BLISSFY" Favorit 24–30px/700. Kanan: ikon search, ikon cart (dengan badge jumlah item), ikon "Lacak Pesanan" (pengganti akun, mengarah ke input order tracking). Tidak ada ikon wishlist/akun di MVP.

### Announcement Bar
Strip hitam full-bleed di atas nav, teks putih Favorit 9–12px, satu baris, dipakai untuk info ongkir/promo umum (mis. "Gratis Ongkir Min. Belanja Rp150.000") atau countdown Flash Sale aktif.

### Hero Banner (dikelola Admin)
Full-bleed image (desktop & mobile versi terpisah sesuai data model banner), judul overlay Favorit 30px/400, subtitle 14px, Ghost CTA button menuju target link. Tidak ada slider dot jika hanya 1 banner aktif; gunakan thin rectangular bar (30x2px) bila lebih dari satu.

### Flash Sale Section
Background diberi sedikit penekanan (mis. Warm Fog atau garis atas hitam) agar terasa "urgent" tanpa memakai warna merah. Header section berisi judul "Flash Sale" + **countdown timer** (dihitung dari waktu server, format HH:MM:SS, Favorit 700 monospace-like tabular numbers). Grid produk memakai Product Card varian Flash Sale (lihat di bawah). Section ini otomatis hilang/nonaktif jika tidak ada Flash Sale aktif (Aturan Flash Sale PRD §6.8).

### Category Tab Filter
Tab horizontal text-only, Favorit 12px/500, tab aktif filled hitam teks putih, radius 0px. Dipakai di atas grid produk untuk switch cepat antar kategori (T-Shirt/Shirt/Pants/Jeans/Outerwear) dalam satu gender.

### Filter & Sort Bar
Baris di atas grid listing berisi:
- Tombol "Filter" (membuka panel/drawer): Gender, Category, Size (chip persegi, radius 0px), Color (swatch bulat 16px dengan border aktif 1px hitam), Price range (slider dua handle atau input min–max), Availability (toggle "Hanya yang tersedia").
- Dropdown "Urutkan": Terbaru, Harga Terendah, Harga Tertinggi.
Filter aktif ditampilkan sebagai chip kecil yang bisa dihapus satu per satu ("Reset semua" di ujung kanan).

### Search Input
Underlined text input, border bawah 1px `#333333`, tanpa border samping/background. Placeholder Favorit 12px, Smoke Charcoal 60% opacity. Menampilkan dropdown hasil cepat (nama produk + thumbnail) saat mengetik.

### Product Card
Radius 0px, padding 16px, background putih. Struktur dari atas ke bawah:
1. Gambar produk (fill lebar card, tanpa rounding). Badge di pojok kiri-atas bila relevan: **Baru** / **Best Seller** / **Flash Sale** (teks polos, background hitam solid, tanpa pill radius — sesuai aturan "no badge pill" pada style referensi, jadi berbentuk kotak tajam).
2. Color swatch row (4–6 kotak 12×12px) tepat di bawah gambar — hanya tampil bila produk punya >1 warna.
3. Nama produk — Favorit 12–14px/400.
4. Blok harga (lihat logika di bawah).
5. Sold count kecil ("986 terjual") — Favorit 12px, Smoke Charcoal.
6. Tombol **Quick Add** (filled hitam, radius 4px, 4px 10px padding) di kanan bawah — disabled/abu-abu bila semua variant habis, dan berlabel "Habis" pada state tersebut.

**Logika tampilan harga pada card & detail (mengikuti PRD §6.8):**
```text
Jika Flash Sale aktif untuk produk:
    tampilkan harga normal (coret, Smoke Charcoal) + harga Flash Sale (Carbon Ink, lebih besar)
Jika tidak, tapi regular discount aktif:
    tampilkan harga normal (coret) + harga diskon
Jika tidak ada promo:
    tampilkan harga normal saja
```
Harga akhir selalu berasal dari backend — komponen ini murni presentasi.

### Product Detail Page
Layout dua kolom desktop (gallery kiri, info kanan; stack di mobile):
- **Gallery**: gambar utama besar + thumbnail strip, radius 0px, tanpa border.
- **Judul & harga**: nama produk Favorit 20px/700, blok harga (logika sama seperti card), badge Flash Sale + countdown bila aktif.
- **Sold count**: tampil dekat harga, bukan tersembunyi.
- **Pemilih variant**: Size — tombol kotak (bukan pill) radius 0px, state: default / selected (filled hitam) / disabled (stok habis, dicoret tipis). Color — swatch 20–24px bulat/kotak sesuai warna asli garment, nama warna muncul saat hover/tap.
- **Validasi stok**: pesan inline ("Stok tersisa 3" / "Variant ini habis") muncul begitu size+color dipilih; tombol Add to Cart disabled sampai variant valid dipilih (PRD §6.3: wajib pilih variant sebelum add to cart).
- **Tombol Add to Cart**: filled hitam, full-width di mobile (sticky di bawah viewport saat scroll), Ghost style tidak dipakai di sini karena ini aksi utama transaksional.
- **Accordion informasi**: Material, Fit, Pattern, Care Instruction, Size Guide — masing-masing collapsible, hairline divider antar item, tanpa ikon dekoratif berlebihan (chevron minimal saja).
- **Lokasi toko**: baris kecil di bawah info produk atau di footer detail, format ringkas "Dikirim dari <Kota Toko>" dengan ikon pin outline.

### Cart (Drawer / Page)
Drawer slide-in dari kanan di desktop, full page di mobile. Tiap item: thumbnail, nama produk + snapshot variant (size/color), stepper qty (− angka +), harga per item, tombol hapus (ikon trash outline, tanpa warna merah — cukup ikon hitam). Bagian bawah: input voucher (underlined input + tombol "Terapkan"), ringkasan Subtotal / Discount / Voucher / (Ongkir dihitung di checkout) / **Total Sementara**. CTA "Checkout" filled hitam full-width.

### Guest Checkout
Form bertahap dengan progress indicator sederhana (garis/step angka, bukan warna): Kontak → Alamat → Pengiriman → Review.
- **Kontak**: Nama penerima, WhatsApp, Email.
- **Alamat**: Provinsi, Kota/Kabupaten, Kecamatan, Kode Pos, Alamat lengkap. Input underlined/boxed 4px radius, label di atas field (Favorit 12px, Smoke Charcoal).
- **Pengiriman**: daftar radio kurir + service dari shipping API, tiap opsi menampilkan nama kurir, estimasi hari, dan biaya — hairline antar opsi, opsi terpilih diberi border hitam 1px (bukan background berwarna).
- **Catatan pesanan** (opsional): textarea underlined.
- **Review**: ringkasan item, alamat, kurir, dan breakdown harga sebelum "Buat Pesanan".
Order summary sidebar (desktop) / accordion collapsible (mobile) menampilkan rincian yang sama sepanjang alur.

### Payment — QRIS (DOKU)
Halaman terpusat: kode QR besar di tengah (kotak putih, tanpa border dekoratif), nominal tagihan Favorit 30px/700 di atasnya, **countdown expiry** (HH:MM:SS) di bawah QR dengan teks peringatan saat < 5 menit ("Segera selesaikan pembayaran"), instruksi singkat cara scan, dan indikator status polling ("Menunggu pembayaran…" dengan dot animasi sederhana, bukan spinner berwarna). Saat status berubah ke PAID, tampilkan state sukses (checkmark outline hitam) dan CTA "Lihat Status Pesanan".

### Order Tracking
Diakses via link bertoken (bukan sekadar nomor order). Tampilan: nomor order, ringkasan item, **timeline status** horizontal/vertikal menggunakan dot filled (selesai) vs outline (belum) — WAITING_PAYMENT → PROCESSING → PACKED → SHIPPED → DELIVERED / CANCELLED, info kurir + nomor resi (dengan tombol salin), status pembayaran terpisah dari status fulfillment.

### Voucher Chip
Setelah voucher berhasil diterapkan, tampil sebagai chip kecil (radius 4px, border 1px hitam) dengan kode voucher + tombol "x" untuk menghapus. Voucher invalid/expired menampilkan pesan inline di bawah input, teks Maroon Clay, tanpa ikon alert berwarna mencolok.

### Empty / Error States
Ilustrasi minim (garis/ikon outline hitam saja, tanpa warna), judul singkat, deskripsi 1 baris, dan CTA bila relevan:
- Katalog kosong → "Belum ada produk di kategori ini."
- Pencarian tanpa hasil → "Produk tidak ditemukan untuk '<query>'." + saran hapus filter.
- API/store error → "Terjadi kendala. Coba lagi." + tombol Refresh.
- Tracking token tidak valid → "Data pesanan tidak ditemukan."

### Footer
Background Warm Fog atau putih dengan hairline atas. Berisi: info toko (nama, alamat/lokasi toko), kategori cepat (Men/Women/Unisex), kebijakan (nanti diisi sesuai keputusan retur/refund final — Open Question §10.13), kontak WhatsApp/Email, ikon sosial outline.

---

## 6. Do's and Don'ts

### Do
- Pakai Favorit di seluruh touchpoint UI (nav, harga, tombol, tab) dengan tracking 0.025em sebagai identitas tipografis utama.
- Jaga radius 0px untuk kartu produk, gambar, dan badge; radius 4px hanya untuk tombol & input.
- Biarkan foto produk membawa warna — chrome UI tetap near-monochrome, dengan Warm Fog/Blush Sand/Pale Tide hanya untuk banding section (mis. Sale, New Arrivals).
- Tampilkan sold count dan status stok apa adanya (transparan), sesuai kebutuhan persona Alya & Raka yang ingin informasi jelas sebelum beli.
- Gunakan bentuk/berat huruf (filled vs outline, bold vs regular) untuk membedakan status, bukan warna sinyal terang.
- Terapkan countdown berbasis waktu server pada Flash Sale dan sesi pembayaran QRIS — jangan hitung mundur dari waktu device customer.

### Don't
- Jangan pakai warna merah/hijau/kuning sebagai indikator status (stok, error, sukses) — pertahankan palet monokrom + 1 pengecualian teks error (Maroon Clay).
- Jangan tambahkan shadow/elevasi pada card, drawer, atau modal — pisahkan elemen dengan whitespace & hairline saja.
- Jangan izinkan Add to Cart aktif sebelum size & color dipilih (selalu validasi di UI selain di backend).
- Jangan tampilkan ikon akun/login di navigasi — MVP adalah guest-only.
- Jangan gunakan ongkir "tebakan" di UI checkout bila shipping API gagal — tampilkan error state, bukan angka default.
- Jangan menumpuk badge promo (Flash Sale + Regular Discount) sekaligus pada satu produk — sesuai aturan Flash Sale menggantikan discount selama periode aktif.

---

## 7. Quick Start — CSS Tokens

```css
@theme {
  /* Colors */
  --color-carbon-ink: #000000;
  --color-paper-white: #ffffff;
  --color-soft-mist: #e5e7eb;
  --color-warm-fog: #f0efe7;
  --color-blush-sand: #f5ebd5;
  --color-smoke-charcoal: #333333;
  --color-onyx: #1d1d1d;
  --color-stone-gray: #cccccc;
  --color-slate: #2f3440;
  --color-olive-drab: #636355;
  --color-maroon-clay: #523037;
  --color-deep-iris: #222845;
  --color-pewter: #677284;
  --color-driftwood: #dfccbe;
  --color-pale-tide: #badce4;

  /* Typography */
  --font-favorit: 'Favorit', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-nunito-sans: 'Nunito Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-body: 14px;
  --leading-body: 1.33;
  --tracking-body: 0.35px;
  --text-heading: 20px;
  --leading-heading: 1.2;
  --tracking-heading: 0.5px;
  --text-display: 30px;
  --leading-display: 1.2;
  --tracking-display: 0.75px;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;

  /* Border Radius */
  --radius-md: 4px;
  --radius-tags: 0px;
  --radius-cards: 0px;
  --radius-images: 0px;
  --radius-inputs: 4px;
  --radius-buttons: 4px;

  /* Layout */
  --page-max-width: 1440px;
  --section-gap: 64px;
  --card-padding: 16px;
  --element-gap: 8px;
}
```

---

## 8. Catatan Keterkaitan dengan PRD

- Struktur homepage (Hero, Flash Sale, New Arrivals, Best Sellers, Sale, Featured Products, Men, Women) mengikuti PRD §6.1; seluruh section ini dikelola Admin (di luar scope dokumen ini).
- Logika prioritas harga (Flash Sale > Regular Discount > Normal) mengikuti PRD §6.8 dan tercermin langsung di komponen Product Card & Product Detail.
- Halaman Order Tracking sengaja tidak memakai nomor order sebagai kredensial (PRD §6.14) — akses hanya lewat link bertoken.
- Beberapa Open Question PRD (§10) — seperti aturan voucher saat Flash Sale aktif, minimum purchase voucher, dan kebijakan retur — belum tercermin sebagai copy/UI final di sini dan perlu direvisi begitu keputusan diambil.
