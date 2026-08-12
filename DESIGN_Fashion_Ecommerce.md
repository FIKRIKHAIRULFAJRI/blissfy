# DESIGN.md

## Blissfy.co Fashion E-Commerce Web Application

> Dokumen ini adalah sumber acuan visual dan interaction design untuk implementasi web app fashion e-commerce. Seluruh keputusan UI harus mengikuti dokumen ini kecuali PRD atau kebutuhan bisnis terbaru menyatakan lain.

| Metadata | Nilai |
|---|---|
| Status | Draft v1.2 - Operational Decisions Finalized |
| Tanggal | 12 Agustus 2026 |
| Brand | Blissfy.co |
| Referensi visual | Editorial minimalist fashion storefront |
| Platform | Responsive web, mobile-first |
| Framework target | Next.js + TypeScript + Tailwind CSS |
| Target deployment | Vercel |
| Produk | Single-store fashion e-commerce |

---

## 1. Design Intent

Blissfy.co harus terasa seperti **editorial fashion catalogue yang elegan, tenang, modern, dan premium**, tetapi tetap mudah digunakan untuk transaksi nyata. Estetika utama diambil dari referensi: ruang putih luas, fotografi fashion dominan, tipografi Poppins dengan permainan ukuran dan weight, palet netral hangat, kartu produk tanpa dekorasi berlebihan, dan bentuk membulat yang lembut.

Desain tidak boleh menjadi salinan identik referensi. Ambil bahasa visualnya, kemudian adaptasikan untuk merek toko, kebutuhan guest checkout, ongkir Indonesia, QRIS, status pesanan, serta dashboard admin.

### 1.1 Kata kunci visual

- Editorial
- Refined
- Minimal
- Warm neutral
- Confident
- Image-led
- Spacious
- Timeless
- Trustworthy

### 1.2 Sasaran pengalaman

1. Produk menjadi fokus utama, bukan dekorasi antarmuka.
2. Pelanggan memahami harga, diskon, varian, stok, ongkir, dan total tanpa kebingungan.
3. Checkout tanpa akun terasa singkat dan aman.
4. Pembayaran QRIS 10 menit memiliki status yang sangat jelas.
5. Tampilan premium tidak mengorbankan aksesibilitas, kecepatan, atau keterbacaan.
6. Mobile terasa dirancang secara khusus, bukan versi desktop yang diperkecil.

## 2. Visual Analysis Referensi

Elemen yang diadopsi dari referensi:

- Header tipis dengan wordmark Blissfy.co di kiri, navigasi tenang, serta aksi menu dan cart di kanan.
- Hero fotografis besar dengan radius lembut dan headline Poppins berskala besar.
- Kombinasi Poppins regular, medium, semibold, dan italic untuk menciptakan ritme editorial.
- Tombol berbentuk pill dengan ikon panah.
- Kartu produk berlatarkan abu-abu/ivory sangat muda tanpa border berat.
- Informasi produk diletakkan di luar area foto agar produk mendapat ruang.
- Color swatch kecil dan understated.
- Section heading dengan banyak negative space.
- Grid editorial yang sesekali dipatahkan oleh banner atau storytelling image.
- Palet putih hangat, charcoal, taupe, stone, dan olive.

Elemen yang harus diperbaiki dari referensi ketika diterapkan:

- Ukuran teks metadata tidak boleh terlalu kecil.
- Target klik icon harus minimal 44 x 44 px pada mobile.
- Kontras teks harus tetap memenuhi aksesibilitas.
- Navigasi dan checkout harus lebih eksplisit daripada halaman editorial murni.
- Informasi diskon, stok, pengiriman, dan status pembayaran harus memiliki hierarchy yang jelas.

## 3. Design Principles

### 3.1 Product first

Gunakan fotografi berkualitas dan area gambar besar. Hindari frame visual yang bersaing dengan produk.

### 3.2 Quiet confidence

Antarmuka tidak menggunakan gradient mencolok, efek neon, glassmorphism, atau shadow berat. Premium dibangun melalui typography, whitespace, proporsi, dan kualitas gambar.

### 3.3 Clarity at conversion points

Pada product detail, cart, checkout, shipping, dan payment, kejelasan lebih penting daripada ekspresi editorial. Harga, pilihan varian, error, dan CTA harus mudah ditemukan.

### 3.4 Progressive disclosure

Informasi primer selalu terlihat. Informasi tambahan seperti detail material, perawatan, dan kebijakan dapat menggunakan accordion.

### 3.5 Honest commerce

Tidak boleh ada dark pattern: biaya tersembunyi, countdown palsu, stok palsu, tombol menyesatkan, preselected add-on, atau diskon semu.

### 3.6 Consistency over novelty

Gunakan token dan komponen yang sama di seluruh storefront. Variasi editorial hanya boleh muncul pada hero, campaign banner, collection story, dan brand story.

## 4. Brand Foundation

Nama merek final adalah **Blissfy.co**. Gunakan nama ini secara konsisten pada wordmark, metadata, checkout, email transaksi, halaman status pesanan, serta dashboard admin.

### 4.1 Wordmark treatment

- Gunakan wordmark teks `Blissfy.co` sebagai identitas utama; Blissfy.co tidak menggunakan logo grafis.
- Wordmark menggunakan Poppins SemiBold dengan tracking `-0.03em`.
- Penulisan harus konsisten: huruf `B` kapital, `lissfy` huruf kecil, diikuti `.co` tanpa spasi.
- Jangan menulis `BLISSFY.CO`, `Blissfy Co`, atau `blissfy.co` pada wordmark utama.
- Area aman wordmark minimal setara tinggi huruf `B` di setiap sisi.
- Favicon sementara boleh menggunakan huruf `B` bergaya sederhana.

### 4.2 Brand voice

- Singkat dan percaya diri.
- Hangat tetapi tidak terlalu kasual.
- Tidak berlebihan atau memaksa.
- Menggunakan Bahasa Indonesia yang jelas.
- Istilah teknis pembayaran dan pengiriman dijelaskan secara sederhana.

Contoh microcopy:

- Hero: **Find your everyday bliss.** atau padanan Indonesia **Temukan nyaman dalam setiap gaya.**
- Supporting copy: **Pilihan esensial untuk bergerak dengan percaya diri setiap hari.**
- Primary CTA: **Belanja sekarang**
- Secondary CTA: **Lihat koleksi**
- Empty cart: **Keranjangmu masih kosong. Temukan sesuatu yang cocok untukmu.**
- Payment pending: **Menunggu pembayaran QRIS**
- Payment success: **Pembayaran berhasil. Pesananmu sedang kami siapkan.**

### 4.3 Photography direction

- Cahaya natural atau soft studio light.
- Tone hangat dan desaturated ringan.
- Latar netral: ivory, stone, warm grey, muted olive, atau kayu muda.
- Produk catalogue menggunakan angle dan crop yang konsisten.
- Foto lifestyle memberi ruang untuk overlay copy.
- Hindari background ramai, saturasi berlebihan, dan filter dingin.
- Rasio foto produk utama konsisten `4:5`.
- Foto campaign dapat memakai `16:9`, `3:2`, atau `4:5` sesuai section.

## 5. Color System

Palet harus terasa hangat, natural, dan editorial. Gunakan warna brand sebagai aksen terukur, bukan memenuhi seluruh halaman.

### 5.1 Core palette

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-canvas` | `#F5F3EE` | Latar luar/section alternatif |
| `--color-surface` | `#FFFEFA` | Latar utama, cards, sheets |
| `--color-surface-muted` | `#EFEEE9` | Area foto produk, input disabled |
| `--color-ink` | `#171713` | Teks utama dan primary button |
| `--color-ink-soft` | `#4F4E47` | Teks sekunder |
| `--color-ink-muted` | `#77756C` | Metadata dan placeholder |
| `--color-border` | `#D9D7D0` | Border default |
| `--color-border-strong` | `#AAA79D` | Border active/selected |
| `--color-olive` | `#6F7254` | Aksen brand, swatch, subtle badge |
| `--color-taupe` | `#A59A86` | Aksen sekunder |
| `--color-clay` | `#B9654A` | Sale accent terbatas |
| `--color-white` | `#FFFFFF` | Teks di atas foto gelap |

### 5.2 Semantic palette

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-success` | `#2F6B4F` | Pembayaran berhasil, tersedia |
| `--color-success-bg` | `#E7F0EA` | Success callout |
| `--color-warning` | `#8A5A18` | Pending, stok rendah |
| `--color-warning-bg` | `#F7EEDC` | Pending callout |
| `--color-danger` | `#9A3F35` | Error, expired, destructive action |
| `--color-danger-bg` | `#F7E7E4` | Error callout |
| `--color-info` | `#365F73` | Informasi pengiriman |
| `--color-info-bg` | `#E7EFF2` | Info callout |

### 5.3 Color rules

- Body page menggunakan `surface` atau `canvas`, bukan pure grey dingin.
- Primary CTA menggunakan `ink` dengan teks putih.
- Sale badge boleh menggunakan `clay`, tetapi bukan bright red.
- Status tidak boleh dibedakan hanya dengan warna; selalu sertakan ikon dan label.
- Teks body di atas background terang minimal memakai `ink-soft`.
- Pastikan contrast ratio WCAG AA.

## 6. Typography

Gunakan **Poppins sebagai satu-satunya keluarga font utama** untuk seluruh storefront dan dashboard admin. Karakter editorial dibangun melalui skala, weight, tracking, layout, fotografi, dan penggunaan italic yang terbatas—bukan melalui pasangan font serif.

### 6.1 Font recommendation

| Peran | Font utama | Fallback |
|---|---|---|
| Display / heading | `Poppins` | Arial, sans-serif |
| Body / UI | `Poppins` | Arial, sans-serif |

Muat Poppins melalui `next/font/google` agar font dioptimalkan oleh Next.js. Gunakan subset Latin dan weight `400`, `500`, `600`, serta `700`. Aktifkan style italic hanya jika benar-benar digunakan. Jangan memuat seluruh weight tanpa kebutuhan.

### 6.2 Type scale desktop

| Token | Size / Line height | Weight | Penggunaan |
|---|---|---|---|
| `display-xl` | `72/0.98` | 600 | Hero utama |
| `display-lg` | `60/1.00` | 600 | Campaign title |
| `display-md` | `46/1.05` | 600 | Section statement |
| `heading-xl` | `40/1.10` | 600 | Page title |
| `heading-lg` | `32/1.15` | 600 | Section heading |
| `heading-md` | `24/1.20` | 500 | Card/checkout title |
| `body-lg` | `18/1.55` | 400 | Lead paragraph |
| `body-md` | `16/1.55` | 400 | Body default |
| `body-sm` | `14/1.45` | 400 | Supporting text |
| `label` | `13/1.30` | 600 | Controls and metadata |
| `caption` | `12/1.35` | 500 | Caption terbatas |

### 6.3 Type scale mobile

- Hero: `44px`, line-height `1.02`, weight `600`.
- Page title: `36px`, line-height `1.08`, weight `600`.
- Section title: `30px`, line-height `1.08`.
- Heading card: `22px`, line-height `1.2`.
- Body default tetap `16px`; jangan mengecilkan body menjadi 12-13 px.

### 6.4 Typography rules

- Poppins SemiBold digunakan untuk headline dan page title.
- Poppins Regular digunakan untuk body; Medium/SemiBold untuk UI, label, harga, dan tombol.
- Poppins Italic hanya untuk 1-3 kata yang ditekankan; jangan membuat paragraf panjang italic.
- Jangan menambahkan font kedua tanpa revisi dokumen desain.
- Gunakan tracking negatif ringan `-0.02em` hingga `-0.04em` pada display heading, dan tracking normal pada body.
- Gunakan `font-variant-numeric: tabular-nums` untuk countdown, total, dan data transaksi.

## 7. Spacing, Grid, and Layout

### 7.1 Spacing scale

Gunakan kelipatan dasar 4 px:

```text
1: 4px    2: 8px    3: 12px   4: 16px
5: 20px   6: 24px   8: 32px   10: 40px
12: 48px  16: 64px  20: 80px  24: 96px
```

### 7.2 Page container

| Breakpoint | Container | Side padding | Grid |
|---|---:|---:|---:|
| Mobile `<640` | 100% | 16 px | 4 columns |
| Small tablet `640-767` | 100% | 24 px | 6 columns |
| Tablet `768-1023` | 100% | 32 px | 8 columns |
| Desktop `1024-1439` | 100% | 48 px | 12 columns |
| Wide `>=1440` | max 1440 px | 56 px | 12 columns |

Content utama harus mempunyai lebar maksimum. Jangan meregangkan katalog tanpa batas pada monitor besar.

### 7.3 Section rhythm

- Desktop: jarak antarseksi `96-128px`.
- Tablet: `72-96px`.
- Mobile: `56-72px`.
- Section header ke content grid: `32-40px` desktop, `24px` mobile.
- Editorial whitespace adalah bagian dari desain; jangan mengisi setiap ruang kosong.

### 7.4 Border radius

| Token | Nilai | Penggunaan |
|---|---:|---|
| `radius-sm` | 8 px | Chips, small controls |
| `radius-md` | 14 px | Inputs, cards, dropdown |
| `radius-lg` | 20 px | Product image, panels |
| `radius-xl` | 28 px | Hero, campaign banner |
| `radius-pill` | 999 px | Buttons, filter pills, badges |

### 7.5 Shadow

Shadow dipakai sangat terbatas:

```css
--shadow-float: 0 12px 36px rgb(23 23 19 / 0.10);
--shadow-menu: 0 8px 24px rgb(23 23 19 / 0.08);
```

Product cards tidak menggunakan shadow default.

## 8. Iconography and Motion

### 8.1 Icons

- Gunakan satu library outline, misalnya Lucide React.
- Stroke `1.5px` atau `1.75px`.
- Ukuran umum 18-22 px.
- Icon-only button memiliki label aksesibel dan target minimal 44 px.
- Gunakan ikon seperlunya; jangan mencampur emoji sebagai ikon UI.

### 8.2 Motion

- Duration cepat: `150ms`.
- Default: `220ms`.
- Editorial reveal maksimal: `450ms`.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Product hover: gambar scale maksimal `1.03` dengan overflow hidden.
- Button hover: perubahan warna/translate ikon 2-4 px, bukan scale berlebihan.
- Drawer menggunakan slide dan backdrop fade.
- Hormati `prefers-reduced-motion`.
- Jangan menggunakan scroll hijacking, parallax berat, atau autoplay carousel agresif.

## 9. Core Components

### 9.1 Announcement bar

- Tinggi 32-36 px.
- Background `ink`; teks `surface`.
- Isi singkat: promo, informasi pengiriman, atau campaign.
- Satu link maksimal.
- Dapat ditutup jika bersifat campaign.

### 9.2 Store header

**Desktop**

- Tinggi 72-80 px.
- Wordmark teks `Blissfy.co` di kiri.
- Navigasi utama di tengah: New Arrivals, Pria/Wanita atau kategori bisnis, Collections, About.
- Search, menu opsional, dan cart di kanan.
- Cart count berupa lingkaran `ink` berukuran 20-22 px.
- Sticky setelah pengguna melewati hero; gunakan surface 92% dan subtle blur hanya jika kontras tetap baik.

**Mobile**

- Tinggi 64 px.
- Menu di kiri, wordmark teks `Blissfy.co` di tengah atau kiri, search/cart di kanan.
- Navigasi dibuka sebagai full-height drawer.
- Drawer memuat kategori, collection, halaman kebijakan, dan kontak.

### 9.3 Buttons

| Variant | Style | Penggunaan |
|---|---|---|
| Primary | Ink background, white text | Add to cart, checkout, pay/retry |
| Secondary | Transparent, 1 px ink border | View collection, alternative action |
| Soft | Surface-muted background | Filter, utility |
| Ghost | No fill, text + arrow | View all, back |
| Destructive | Danger background/text | Cancel/archive confirmation |

Aturan:

- Tinggi default 48 px; large 54 px; compact 40 px.
- Padding horizontal 20-24 px.
- Radius pill untuk storefront; radius 10-12 px dapat digunakan di admin.
- Loading mempertahankan lebar tombol dan menampilkan spinner.
- Disabled tidak hanya menurunkan opacity; cursor dan label harus jelas.

### 9.4 Product card

Struktur:

1. Image container `4:5`, background `surface-muted`, radius `lg`.
2. Sale/new badge kiri atas jika relevan.
3. Wishlist tidak masuk MVP; jangan tampilkan heart palsu yang tidak berfungsi.
4. Nama produk maksimum dua baris.
5. Harga regular dan sale.
6. Color swatches maksimum empat; sisanya ditulis `+N`.
7. Label stok rendah jika benar-benar relevan.

Desktop hover:

- Gambar pertama berpindah ke gambar kedua jika tersedia.
- Nama mendapat underline halus atau image zoom kecil.
- Jangan menampilkan quick-add jika varian wajib dipilih; arahkan ke product detail.

Mobile:

- Dua kolom.
- Gap 12-16 px.
- Informasi tetap terbaca; jangan mengecilkan harga di bawah 13 px.

### 9.5 Price display

- Harga aktif memiliki contrast tertinggi.
- Harga normal yang didiskon menggunakan strike-through dan muted color.
- Badge diskon menampilkan nilai nyata, contoh `-20%`.
- Format Rupiah: `Rp189.000`, tanpa desimal.
- Product detail menampilkan savings opsional: `Hemat Rp40.000`.

### 9.6 Variant selector

**Warna**

- Circular swatch 28-32 px dengan border luar saat dipilih.
- Nama warna selalu tersedia dalam teks.
- Swatch putih memiliki border.

**Ukuran**

- Button/chip minimal 44 x 44 px.
- Selected: background ink, text white.
- Sold out: disabled dengan diagonal line atau label, bukan opacity saja.
- Link **Panduan ukuran** berada sejajar dengan label Ukuran.
- Error muncul jika user menekan Add to Cart tanpa memilih varian.

### 9.7 Form controls

- Label selalu terlihat di atas input; jangan hanya memakai placeholder.
- Tinggi input 50-52 px.
- Radius 12-14 px.
- Border default `border`, focus `ink` dengan ring 2 px transparan/olive muda.
- Helper/error text berjarak 6-8 px.
- Dropdown alamat harus searchable jika daftar panjang.
- Gunakan input mode yang benar untuk telepon dan kode pos.

### 9.8 Badge and status chip

- Bentuk pill, padding `6px 10px`.
- Selalu memiliki ikon opsional + label teks.
- Contoh: `Menunggu pembayaran`, `Dibayar`, `Kedaluwarsa`, `Dikirim`.
- Status bisnis harus menggunakan vocabulary yang konsisten dengan PRD.

### 9.9 Toast, inline alert, and modal

- Toast digunakan untuk feedback ringan, bukan error kritis.
- Error checkout/payment selalu ditampilkan inline pada area yang relevan.
- Modal hanya untuk confirmation atau keputusan kecil.
- Mobile menggunakan bottom sheet untuk filter, pilihan, atau confirmation bila lebih nyaman.

### 9.10 Skeleton and empty state

- Skeleton mengikuti bentuk content sebenarnya.
- Gunakan warm grey, bukan shimmer kontras tinggi.
- Empty state memakai headline singkat, satu paragraf, dan satu CTA.
- Jangan menggunakan ilustrasi generik yang tidak sesuai brand.

## 10. Storefront Page Specifications

### 10.1 Home page

Urutan section yang disarankan:

1. Announcement bar.
2. Header.
3. Hero campaign.
4. New & Trending.
5. Category/collection split banner.
6. Featured collection grid.
7. Brand statement/editorial collage.
8. Campaign banner.
9. Service promises.
10. Newsletter opsional.
11. Footer.

#### Hero

- Desktop tinggi target `clamp(620px, 72vh, 820px)`.
- Image full-bleed di dalam rounded container.
- Gunakan overlay gradient sangat lembut hanya untuk keterbacaan teks.
- Eyebrow/description di kiri atas.
- Headline besar di kanan bawah atau area negative space foto.
- CTA pill di kiri bawah.
- Maksimal dua CTA.
- Carousel hanya jika bisnis mempunyai campaign yang cukup; default MVP menggunakan satu hero statis untuk performa dan fokus.

#### New & Trending

- Desktop 3 atau 4 kolom berdasarkan lebar container.
- Mobile horizontal scroll snap atau grid dua kolom. Pilih grid dua kolom sebagai default agar semua produk mudah ditemukan.
- Section title dapat mengombinasikan Poppins SemiBold + Italic seperti `New & *Trending*`.

#### Collection split banner

- Dua kartu landscape pada desktop; stack pada mobile.
- Foto mewakili kategori nyata.
- Judul dan CTA di atas foto dengan contrast layer secukupnya.

#### Brand story collage

- Statement Poppins SemiBold berskala besar di tengah.
- 3-4 foto kecil mengelilingi statement secara editorial.
- Pada mobile, ubah menjadi statement lalu grid foto; jangan mempertahankan posisi absolute yang menyebabkan overlap.

#### Service promises

Tiga item:

- Pengiriman ke seluruh Indonesia.
- Pembayaran QRIS aman.
- Bantuan melalui kontak toko.

Jangan menjanjikan retur mudah sebelum kebijakan retur final.

### 10.2 Product listing / collection page

#### Header section

- Breadcrumb kecil.
- Judul kategori menggunakan Poppins SemiBold.
- Deskripsi maksimal 2-3 baris.
- Jumlah produk.

#### Toolbar

- Desktop: filter di kiri, sort dan count di kanan.
- Mobile: tombol `Filter` dan `Urutkan` sticky ringan atau berada tepat di atas grid.
- Filter membuka side sheet/bottom sheet.
- Active filters ditampilkan sebagai removable chips.

#### Grid

- Wide desktop: 4 kolom.
- Desktop/tablet: 3 kolom.
- Mobile: 2 kolom.
- Pagination direkomendasikan untuk SEO dan stabilitas; tombol **Muat lebih banyak** boleh digunakan sebagai enhancement.

### 10.3 Product detail page

#### Desktop layout

- Grid 7/5 atau 8/4.
- Galeri gambar di kiri; purchasing panel di kanan.
- Purchasing panel boleh sticky dengan offset header.
- Galeri menggunakan 2-column masonry ringan atau satu gambar besar + thumbnails. Untuk MVP, pilih satu gambar besar + thumbnail vertikal/horizontal agar implementasi stabil.

#### Mobile layout

- Galeri swipe dengan indicator `1 / N`.
- Detail produk di bawah galeri.
- Sticky bottom Add to Cart boleh digunakan setelah varian dipilih, tetapi jangan menutupi content.

#### Information order

1. Breadcrumb.
2. Product name.
3. Price dan discount.
4. Short description.
5. Color selector.
6. Size selector + size guide.
7. Stock message.
8. Quantity.
9. Add to Cart.
10. Shipping note.
11. Accordion: details, material, care, shipping/return.

Add to Cart tidak boleh aktif jika varian belum valid atau stok habis.

### 10.4 Cart

Desktop menggunakan dua kolom:

- Kiri: daftar item.
- Kanan: order summary sticky.

Mobile menggunakan satu kolom dengan checkout CTA tetap mudah dijangkau.

Setiap item menampilkan:

- Thumbnail.
- Nama produk.
- Warna dan ukuran.
- Harga satuan/final.
- Quantity stepper.
- Remove action.
- Informasi perubahan harga/stok jika ada.

Order summary menampilkan subtotal, diskon produk, estimasi ongkir belum termasuk, dan total sementara. Jangan menampilkan ongkir `Rp0` sebelum alamat dihitung; gunakan label **Dihitung saat checkout**.

### 10.5 Guest checkout

Checkout harus lebih utilitarian dan minim distraksi daripada homepage.

#### Header checkout

- Wordmark teks `Blissfy.co`.
- Label **Checkout aman** dengan lock icon.
- Link kembali ke keranjang.
- Navigasi marketing disembunyikan.

#### Desktop

- Form di kiri `7 columns`.
- Ringkasan pesanan sticky di kanan `5 columns`.

#### Mobile

- Accordion ringkasan berada di atas form.
- Single column.
- CTA full width.

#### Section form

1. Informasi penerima.
2. Alamat pengiriman.
3. Pilihan kurir.
4. Catatan opsional.
5. Persetujuan syarat dan privasi.

Email adalah field wajib. Gunakan label **Email** tanpa kata “opsional”, input type `email`, validasi inline, dan helper text bahwa bukti transaksi akan dikirim melalui email.

#### Shipping options

Gunakan selectable cards yang menampilkan:

- Nama kurir dan layanan.
- Estimasi pengiriman.
- Tarif.
- Selected state yang jelas.

Hanya tampilkan layanan **J&T** dan **JNE** yang benar-benar tersedia dari respons API. Jangan menampilkan kurir lain sebagai placeholder.

Loading tarif menampilkan skeleton. Jika gagal, tampilkan pesan dan tombol **Coba lagi**; checkout tidak dapat dilanjutkan tanpa tarif valid.

#### Final summary

```text
Subtotal
Diskon produk
Ongkos kirim
Total pembayaran
```

CTA: **Lanjut ke pembayaran QRIS**.

### 10.6 QRIS payment page

Halaman ini harus sangat fokus dan tidak menampilkan marketing content.

#### Layout

- Centered payment card, max-width 560 px.
- Wordmark teks `Blissfy.co` dan nomor pesanan di atas.
- Status chip.
- Total pembayaran dalam ukuran besar.
- QR code minimal 240 x 240 px desktop dan 220 x 220 px mobile.
- Countdown tabular `09:59`.
- Instruksi singkat 3 langkah.
- Link/copy order number.
- Tombol **Cek status pembayaran** sebagai fallback.

#### Payment states

**Pending**

- Warning neutral, bukan merah.
- Countdown jelas.
- Copy: **Selesaikan pembayaran sebelum waktu habis.**
- QR tetap terlihat.

**Verifying**

- Spinner dan copy: **Memverifikasi pembayaranmu...**
- Jangan meminta user membayar ulang.

**Success**

- Success icon dan status `Pembayaran berhasil`.
- Ringkasan next step.
- CTA **Lihat status pesanan**.
- QR dan countdown dihilangkan.

**Expired**

- Danger callout tanpa dramatisasi.
- QR tidak aktif dan diberi overlay.
- Copy menjelaskan stok dan harga akan diperiksa ulang.
- CTA **Buat pembayaran baru**.

**Failed/unknown**

- Jelaskan bahwa sistem belum dapat memastikan status.
- Tawarkan **Cek lagi** dan kontak bantuan.
- Jangan langsung menyatakan pembayaran gagal jika status belum pasti.

### 10.7 Order tracking page

- Akses melalui secret token.
- Header sederhana.
- Status utama dan nomor pesanan.
- Timeline vertikal: pembayaran, diproses, dikemas, dikirim, diterima.
- Item summary.
- Shipment card berisi kurir, layanan, resi, dan copy button.
- Alamat ditampilkan secara terbatas/masked bila tidak diperlukan penuh.
- Bantuan dan kebijakan di bagian bawah.

### 10.8 Static policy pages

- Reading width maksimum 760 px.
- Judul menggunakan Poppins SemiBold dan isi menggunakan Poppins Regular.
- Daftar isi sticky hanya jika dokumen panjang.
- `last updated` terlihat.
- Halaman: About, Contact, Shipping Policy, Return Policy, Privacy Policy, Terms.

## 11. Admin Dashboard Design

Admin tidak perlu meniru gaya editorial homepage secara penuh. Gunakan bahasa visual yang sama melalui warna dan typography, tetapi prioritaskan efisiensi dan kepadatan informasi.

### 11.1 Layout

- Desktop sidebar kiri 240-260 px.
- Topbar dengan page title, search opsional, dan account menu.
- Content background `canvas`; cards `surface`.
- Tablet sidebar collapsible.
- Mobile menggunakan drawer navigation.

### 11.2 Admin typography

- Gunakan Poppins untuk seluruh UI admin.
- Bedakan hierarchy admin melalui weight, size, spacing, dan color; jangan menambahkan font lain.

### 11.3 Dashboard overview

- KPI: pesanan dibayar, nilai penjualan, pending shipment, stok rendah.
- Recent orders table.
- Low stock list.
- Tidak perlu chart kompleks pada MVP.
- Semua metrik memiliki periode yang jelas.

### 11.4 Product management

- Table/list dengan thumbnail, nama, kategori, jumlah varian, stok total, harga, diskon, status.
- Filter status dan kategori.
- Product form dibagi menjadi: basic info, media, pricing, variants, inventory, SEO.
- Unsaved changes warning.
- Upload image memiliki progress, reorder, alt text, dan error state.

### 11.5 Variant editor

- Gunakan tabel karena data berulang.
- Kolom: warna, ukuran, SKU, berat, stok, status.
- Bulk generation size/color boleh ditambahkan.
- Validasi SKU unik dan angka non-negatif.

### 11.6 Orders

- Table: order number, customer, payment, fulfillment, total, date.
- Payment dan fulfillment menggunakan status chip terpisah.
- Detail order menampilkan timeline event, item, customer, address, shipping, payment, dan admin actions.
- Tombol perubahan status menggunakan menu/action panel, bukan edit bebas.
- Resi mempunyai input jelas dan confirmation.

### 11.7 Settings

- Store identity.
- Alamat asal pengiriman: Jl. Mahoni, Temu Ireng, Sukorejo, Kec. Ulujami, Kabupaten Pemalang, Jawa Tengah 52371.
- Berat kemasan default.
- Kontak toko.
- Policy links.
- Integrasi ditampilkan sebagai status konfigurasi tanpa memperlihatkan secret.

## 12. Responsive Behavior

### Mobile first rules

- Jangan menyembunyikan informasi penting hanya karena ruang sempit.
- Ubah multi-column menjadi stack, bukan mengecilkan komponen.
- Horizontal scroll hanya untuk thumbnail, chips, atau content yang memang cocok.
- Semua touch target minimal 44 x 44 px.
- Bottom sheet digunakan untuk filter/sort.
- Sticky action tidak boleh menutupi error, keyboard, atau browser safe area.
- Gunakan `env(safe-area-inset-bottom)` untuk bottom action.

### Breakpoint behavior summary

| Elemen | Mobile | Tablet | Desktop |
|---|---|---|---|
| Product grid | 2 kolom | 3 kolom | 4 kolom |
| Hero | Stacked overlay | Overlay | Editorial overlay |
| PDP | Single column | Single/2 column | Gallery + sticky info |
| Cart | Single column | Single/2 column | 2 column |
| Checkout | Single column | 2 column optional | 7/5 grid |
| Admin nav | Drawer | Collapsed sidebar | Full sidebar |

## 13. Accessibility Requirements

- Gunakan semantic HTML: header, nav, main, section, article, footer.
- Heading hierarchy tidak boleh melompat tanpa alasan.
- Visible focus ring wajib ada.
- Skip link tersedia.
- Semua icon-only action memiliki `aria-label`.
- Galeri dapat digunakan dengan keyboard.
- Dialog memerangkap focus dan dapat ditutup dengan Escape bila aman.
- Error form ditautkan melalui `aria-describedby`.
- Status async diumumkan melalui live region yang sesuai.
- Alt text menjelaskan produk, warna, dan angle bila relevan.
- Countdown tidak diumumkan setiap detik oleh screen reader; berikan pembaruan pada interval bermakna.
- QR code memiliki instruksi alternatif dan status tekstual.
- Jangan bergantung pada hover.

## 14. Content and Localization

- Bahasa utama: Indonesia.
- Mata uang: IDR dengan format `Rp189.000`.
- Waktu mengikuti zona bisnis/pengguna yang ditetapkan; tampilkan batas pembayaran secara jelas.
- Nomor telepon menggunakan format Indonesia dan menerima `08...` atau `+62...`, kemudian dinormalisasi backend.
- Hindari campuran istilah seperti `Checkout`, `Order`, dan `Shipping` jika padanan Indonesia jelas; nama teknis admin boleh tetap konsisten bila lebih mudah dipahami.
- Gunakan **Pesanan**, **Pengiriman**, **Pembayaran**, **Keranjang**, dan **Lacak pesanan**.
- Kebijakan privasi harus menjelaskan bahwa data pribadi pelanggan disimpan selama 2 bulan setelah pesanan selesai atau dibatalkan.

## 15. Loading, Error, and Edge States

Setiap feature harus memiliki desain untuk:

- Initial loading.
- Empty state.
- Partial data.
- Network error.
- API provider unavailable.
- Validation error.
- Stok berubah.
- Harga/diskon berubah.
- Ongkir berubah atau expired.
- Payment pending, verifying, success, expired, failed, unknown.
- Unauthorized admin.
- Not found.
- Maintenance/degraded service.

Rules:

- Jangan menampilkan blank page saat loading.
- Jangan menggunakan pesan generik `Something went wrong` tanpa tindakan lanjutan.
- Error harus menjelaskan apa yang terjadi, dampaknya, dan tindakan berikutnya.
- Jika harga/stok berubah, tampilkan perbandingan dan minta konfirmasi sebelum lanjut.

## 16. Tailwind Token Direction

Implementasikan token melalui CSS variables agar theme mudah disesuaikan setelah nama brand final.

```css
:root {
  --canvas: 45 26% 95%;
  --surface: 48 100% 99%;
  --surface-muted: 48 13% 93%;
  --ink: 60 10% 8%;
  --ink-soft: 53 5% 29%;
  --ink-muted: 50 5% 45%;
  --border: 47 9% 83%;
  --olive: 64 15% 39%;
  --taupe: 38 14% 59%;
  --clay: 14 43% 51%;
  --radius: 0.875rem;
}
```

Aturan implementasi:

- Jangan menulis arbitrary color berulang jika token tersedia.
- Buat primitives untuk `Button`, `Input`, `Select`, `Badge`, `Card`, `Dialog`, `Sheet`, `Skeleton`, dan `Toast`.
- Variants dikelola secara terpusat, misalnya dengan CVA.
- Gunakan `cn()` untuk class composition.
- Jangan membuat file komponen monolitik untuk seluruh halaman.

## 17. Component Inventory

### Storefront

```text
AnnouncementBar
StoreHeader
MobileNavDrawer
SearchDrawer
CartButton
HeroCampaign
SectionHeading
ProductGrid
ProductCard
PriceDisplay
DiscountBadge
ColorSwatches
SizeSelector
QuantityStepper
ProductGallery
FilterSheet
SortMenu
CartLineItem
OrderSummary
AddressForm
ShippingOptionCard
PaymentStatusCard
QRCodePanel
CountdownTimer
OrderTimeline
ShipmentCard
PolicyLayout
StoreFooter
```

### Admin

```text
AdminShell
AdminSidebar
AdminTopbar
MetricCard
DataTable
StatusBadge
ProductForm
ImageUploader
VariantTable
InventoryAdjustmentDialog
OrderDetailPanel
OrderEventTimeline
ShipmentForm
SettingsForm
```

## 18. Route-Level Design Checklist

Sebelum sebuah halaman dianggap selesai, periksa:

- Page title dan tujuan halaman jelas.
- Primary action hanya satu yang paling dominan.
- Mobile, tablet, desktop diuji.
- Loading, empty, error, disabled, dan success state tersedia.
- Keyboard navigation berfungsi.
- Focus state terlihat.
- Tidak ada teks di bawah 12 px; body utama minimal 16 px.
- Harga dan status tidak ambigu.
- Semua gambar mempunyai ukuran untuk mencegah layout shift.
- CTA tidak tertutup sticky element.
- Tidak ada secret atau informasi sensitif di UI/client.
- Copy sesuai Bahasa Indonesia dan vocabulary PRD.

## 19. Do and Don't

### Do

- Gunakan whitespace besar dan fotografi kuat.
- Pertahankan hierarchy sederhana.
- Gunakan skala, weight, tracking, whitespace, dan fotografi untuk membangun karakter editorial dengan Poppins.
- Tampilkan diskon dan biaya dengan transparan.
- Gunakan rounded corners lembut secara konsisten.
- Buat checkout dan payment lebih fokus daripada homepage.
- Gunakan status dan feedback yang eksplisit.

### Don't

- Jangan menyalin wordmark, foto, atau copy `AuraLine`; gunakan identitas teks Blissfy.co.
- Jangan memakai gradient mencolok, glass card, neon, atau shadow tebal.
- Jangan menambahkan heart/wishlist jika fiturnya belum ada.
- Jangan menampilkan rating/review palsu.
- Jangan membuat QRIS statis sebagai pengganti QRIS dinamis.
- Jangan menyatakan pembayaran berhasil dari redirect browser saja.
- Jangan menampilkan ongkir nol sebelum dihitung.
- Jangan menambahkan serif atau font dekoratif lain ke sistem Poppins.
- Jangan membuat ukuran teks terlalu kecil demi menyerupai mockup.
- Jangan membuat carousel jika hanya memiliki satu campaign.
- Jangan menggunakan animasi yang menghambat checkout.

## 20. Design Decisions Still Open

Keputusan berikut harus diselesaikan sebelum high-fidelity final:

1. Tagline final Blissfy.co.
2. Apakah toko fokus pada pria, wanita, unisex, atau kategori lain.
3. Palet produk dan gaya fotografi asli.
4. Konten hero dan campaign pertama.
5. Kebijakan retur yang boleh dikomunikasikan.
6. Apakah notifikasi WhatsApp masuk MVP.
7. Berat kemasan default.
8. Detail size guide untuk setiap kategori.
9. Apakah wishlist akan masuk fase setelah MVP.

Sebelum keputusan tersebut tersedia, gunakan placeholder netral dan jangan membuat klaim bisnis yang belum disetujui.

## 21. Definition of Done - UI/UX

Desain/implementasi dianggap sesuai dokumen ini jika:

- Arah visual terasa editorial, warm, minimal, dan premium.
- Storefront dan admin menggunakan token yang konsisten.
- Homepage mengikuti ritme visual referensi tanpa menyalin identitasnya.
- Seluruh halaman PRD memiliki responsive design.
- Product selection, cart, guest checkout, shipping, dan QRIS dapat dipahami tanpa instruksi eksternal.
- State pembayaran 10 menit lengkap: pending, verifying, success, expired, dan unknown/failed.
- Semua kondisi kritis memiliki feedback dan recovery action.
- UI memenuhi accessibility baseline WCAG AA.
- Core Web Vitals dipertimbangkan dalam gambar, font, dan motion.
- Tidak ada fitur palsu atau komponen nonfungsional.
- Design tokens digunakan, bukan styling ad hoc.
- Review dilakukan pada mobile, tablet, desktop, keyboard, dan reduced motion.

---

## Implementation Directive for Codex

Ketika mengimplementasikan desain ini:

1. Baca `PRD_Fashion_Ecommerce.md` dan `DESIGN_Fashion_Ecommerce.md` sebelum mengubah UI.
2. Prioritaskan kebutuhan fungsional PRD jika terjadi konflik dengan dekorasi visual.
3. Bangun design tokens dan primitives terlebih dahulu.
4. Implementasikan mobile-first.
5. Gunakan data realistis tetapi jelas sebagai seed/demo data; jangan membuat review, rating, stok terbatas, atau diskon palsu sebagai klaim bisnis.
6. Jangan mengubah status pembayaran dari client.
7. Pastikan komponen checkout dan payment mempunyai seluruh state sebelum dianggap selesai.
8. Lakukan visual QA pada viewport minimum: `390x844`, `768x1024`, `1440x900`.
9. Periksa accessibility, overflow, layout shift, dan interaction state.
10. Gunakan wordmark teks Blissfy.co sebagai identitas final dan jangan membuat atau menambahkan logo grafis.
