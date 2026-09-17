# Product Requirements Document (PRD)
# Blissfy.co Fashion E-Commerce Web

**Versi:** Final  
**Status:** Final Draft / Implementation Baseline  
**Tanggal:** 16 September 2026  
**Nama Produk:** Blissfy.co  
**Jenis:** Single-store fashion e-commerce  
**Platform:** Web responsif  
**Target User:** Pria dan wanita usia 18–35 tahun  
**Model Bisnis:** Single store, bukan marketplace  
**Target Akhir:** Production-ready dan dapat digunakan untuk transaksi nyata

---

# 1. Problem Statement

## 1.1 Masalah

Calon pelanggan fashion membutuhkan proses belanja yang cepat, sederhana, dan transparan, terutama ketika berbelanja melalui perangkat mobile. Hambatan utama yang harus diselesaikan:

- Pelanggan harus dapat menemukan produk berdasarkan kategori, gender, harga, ukuran, dan warna.
- Pelanggan perlu mengetahui ketersediaan variant sebelum membeli.
- Harga normal, diskon, Flash Sale, voucher, ongkir, dan total pembayaran harus terlihat jelas.
- Pelanggan tidak boleh diwajibkan membuat akun untuk melakukan pembelian.
- Pelanggan membutuhkan informasi status pesanan setelah pembayaran.
- Admin membutuhkan sistem terpusat untuk mengelola produk, variant, stok, promosi, homepage, dan pesanan.

PRD sebelumnya juga mengidentifikasi masalah operasional seperti pengelolaan stok, perhitungan ongkir, konfirmasi pembayaran, dan pengelolaan katalog secara manual.

## 1.2 Dampak

Jika masalah tersebut tidak diselesaikan:

- Pelanggan kesulitan menemukan produk yang sesuai.
- Risiko salah informasi harga atau stok meningkat.
- Checkout menjadi lebih panjang.
- Admin kesulitan mengelola promosi dan katalog.
- Risiko overselling meningkat.
- Status pembayaran dan pesanan sulit dikelola secara konsisten.

## 1.3 Solusi Produk

Blissfy menyediakan:

1. Katalog fashion berdasarkan Men, Women, dan Unisex.
2. Kategori T-Shirt, Shirt, Pants, Jeans, dan Outerwear.
3. Search, filter, dan sorting.
4. Variant ukuran dan warna.
5. Cart dan guest checkout.
6. Perhitungan ongkir melalui shipping API.
7. Pembayaran QRIS melalui DOKU.
8. Order tracking tanpa login.
9. Voucher.
10. Regular discount.
11. Flash Sale.
12. Admin dashboard untuk mengelola kebutuhan toko.
13. Homepage yang dapat dikelola admin.

---

# 2. Target User + 2 Personas

## 2.1 Target User

### Primary User — Customer

- Usia: 18–35 tahun.
- Gender: Pria dan wanita.
- Menggunakan smartphone maupun desktop.
- Membeli pakaian secara online.
- Menginginkan proses pembelian yang sederhana.
- Tidak diwajibkan membuat akun.

### Secondary User — Admin

- Pemilik/pengelola Blissfy.
- Mengelola katalog, stok, promosi, homepage, dan order.

## 2.2 Persona 1 — Fashion Shopper

**Nama:** Alya  
**Usia:** 22 tahun  
**Gender:** Wanita  
**Aktivitas:** Mahasiswa/karyawan muda

**Behavior:**
- Sering melihat produk melalui mobile.
- Membandingkan harga beberapa produk.
- Memperhatikan warna, ukuran, material, dan fit.
- Tertarik dengan produk baru dan Flash Sale.
- Tidak ingin melakukan registrasi sebelum membeli.

**Needs:**
- Search produk cepat.
- Filter berdasarkan ukuran, warna, harga, dan kategori.
- Informasi produk lengkap.
- Harga promo yang jelas.
- Checkout tanpa akun.
- Tracking pesanan.

## 2.3 Persona 2 — Fashion Shopper

**Nama:** Raka  
**Usia:** 28 tahun  
**Gender:** Pria  
**Aktivitas:** Karyawan

**Behavior:**
- Membeli pakaian secara online.
- Mementingkan proses checkout yang cepat.
- Membutuhkan informasi ukuran dan material.
- Memperhatikan ongkir dan estimasi pengiriman.
- Ingin mengetahui status order setelah pembayaran.

**Needs:**
- Navigasi produk sederhana.
- Variant size/color yang jelas.
- Ongkir transparan.
- QRIS.
- Tracking order tanpa login.

---

# 3. Goals and Non-Goals

## 3.1 Goals

### Product Goals

1. Pelanggan dapat menemukan produk dengan cepat.
2. Pelanggan dapat memilih gender Men, Women, atau Unisex.
3. Pelanggan dapat memilih kategori T-Shirt, Shirt, Pants, Jeans, atau Outerwear.
4. Pelanggan dapat memilih size dan color.
5. Pelanggan dapat membeli tanpa akun.
6. Pelanggan dapat menggunakan voucher.
7. Pelanggan dapat membeli produk yang sedang Flash Sale.
8. Pelanggan dapat melihat sold count.
9. Pelanggan dapat melihat lokasi toko.
10. Pelanggan dapat melakukan pembayaran menggunakan QRIS.
11. Pelanggan dapat melacak order.
12. Admin dapat mengelola katalog dan promosi.
13. Admin dapat mengelola seluruh section homepage.
14. Sistem dapat digunakan untuk transaksi nyata setelah integrasi production selesai.

### Technical Goals

- Next.js
- React
- TypeScript
- Tailwind CSS
- NestJS
- Supabase PostgreSQL
- Cloudinary
- DOKU QRIS
- Shipping API
- pnpm workspace + Turborepo

## 3.2 Non-Goals

Tidak termasuk MVP:

- Marketplace/multi-vendor.
- Customer account.
- Loyalty/membership.
- Referral.
- COD.
- Paylater.
- Pembayaran kartu.
- Multi-admin kompleks.
- Chat customer service real-time.
- Wishlist lintas perangkat.
- AI recommendation.
- Mobile application.
- Integrasi marketplace eksternal.
- Refund otomatis.
- Retur mandiri melalui dashboard pelanggan.

---

# 4. User Stories

## 4.1 Customer

### Browsing

> Sebagai pelanggan, saya ingin melihat katalog produk agar saya dapat menemukan pakaian yang ingin dibeli.

> Sebagai pelanggan, saya ingin memilih gender Men, Women, atau Unisex agar produk yang tampil sesuai kebutuhan saya.

> Sebagai pelanggan, saya ingin memilih kategori T-Shirt, Shirt, Pants, Jeans, atau Outerwear agar pencarian produk lebih mudah.

### Search & Filter

> Sebagai pelanggan, saya ingin mencari produk berdasarkan nama agar dapat menemukan produk tertentu dengan cepat.

> Sebagai pelanggan, saya ingin memfilter berdasarkan ukuran, warna, harga, kategori, dan gender agar produk yang tampil lebih relevan.

### Product Detail

> Sebagai pelanggan, saya ingin melihat material, fit, pattern, dan care instruction agar saya dapat memahami karakteristik produk sebelum membeli.

> Sebagai pelanggan, saya ingin memilih ukuran dan warna sebelum memasukkan produk ke cart.

> Sebagai pelanggan, saya ingin melihat harga normal, harga promo, dan harga Flash Sale agar mengetahui harga yang harus dibayar.

> Sebagai pelanggan, saya ingin melihat jumlah produk yang telah terjual agar mendapatkan informasi popularitas produk.

### Cart & Checkout

> Sebagai pelanggan, saya ingin memasukkan beberapa produk ke cart agar dapat membeli beberapa item sekaligus.

> Sebagai pelanggan, saya ingin checkout tanpa membuat akun agar proses pembelian lebih cepat.

> Sebagai pelanggan, saya ingin menggunakan voucher agar mendapatkan potongan sesuai ketentuan.

> Sebagai pelanggan, saya ingin melihat ongkir sebelum membayar agar mengetahui total pembayaran.

### Payment

> Sebagai pelanggan, saya ingin membayar menggunakan QRIS agar dapat melakukan pembayaran secara digital.

> Sebagai pelanggan, saya ingin mengetahui batas waktu pembayaran agar tidak melewatkan masa pembayaran.

### Order Tracking

> Sebagai pelanggan, saya ingin melihat status order menggunakan link tracking agar tidak perlu login.

## 4.2 Admin

> Sebagai admin, saya ingin membuat dan mengubah produk agar katalog selalu dapat diperbarui.

> Sebagai admin, saya ingin mengelola variant, size, color, SKU, harga, berat, dan stok.

> Sebagai admin, saya ingin memilih produk sebagai New Arrival secara manual.

> Sebagai admin, saya ingin memilih produk sebagai Best Seller secara manual.

> Sebagai admin, saya ingin membuat Flash Sale untuk produk tertentu dengan satu harga yang sama untuk seluruh variant.

> Sebagai admin, saya ingin mengatur banner dan section homepage agar tampilan storefront dapat dikelola tanpa mengubah kode.

> Sebagai admin, saya ingin mengelola voucher dan discount.

> Sebagai admin, saya ingin melihat dan memproses order.

---

# 5. Feature List — MVP / V2 / Later

## 5.1 MVP

| Feature | Status |
|---|---|
| Homepage | MVP |
| Header & navigation | MVP |
| Men / Women / Unisex | MVP |
| T-Shirt / Shirt / Pants / Jeans / Outerwear | MVP |
| Product catalog | MVP |
| Product detail | MVP |
| Search | MVP |
| Filter | MVP |
| Sorting | MVP |
| Size variant | MVP |
| Color variant | MVP |
| SKU | MVP |
| Stock per variant | MVP |
| Material | MVP |
| Fit | MVP |
| Pattern | MVP |
| Care Instruction | MVP |
| Sold count | MVP |
| Manual New Arrival | MVP |
| Manual Best Seller | MVP |
| Regular discount | MVP |
| Voucher | MVP |
| Flash Sale | MVP |
| Cart | MVP |
| Guest checkout | MVP |
| Shipping/ongkir | MVP |
| QRIS | MVP |
| Order tracking | MVP |
| Admin dashboard | MVP |
| Product management | MVP |
| Inventory management | MVP |
| Order management | MVP |
| Homepage management | MVP |
| Banner management | MVP |
| Cloudinary upload | MVP |

## 5.2 V2

- Customer account.
- Login/register.
- Order history.
- Saved address.
- Wishlist.
- Review & Rating.
- Automatic shipment tracking.
- Notification.
- Related products.
- Recently viewed products.

## 5.3 Later

- Loyalty point.
- Referral.
- Personalized recommendation.
- AI recommendation.
- Mobile application.
- Multi-vendor.
- Marketplace integration.
- Advanced CRM.
- Personalized homepage.

---

# 6. Detailed Functional Requirements — MVP

## 6.1 Homepage

Homepage minimal memiliki:

1. Hero Banner.
2. Flash Sale.
3. New Arrivals.
4. Best Sellers.
5. Sale.
6. Featured Products.
7. Men.
8. Women.

Admin dapat mengelola seluruh section homepage.

### Banner

Admin dapat mengatur:

- Desktop image.
- Mobile image.
- Title/heading.
- Subtitle.
- CTA.
- Target link.
- Start date/time.
- End date/time.
- Active/inactive.

## 6.2 Product Catalog

Produk memiliki:

- Name.
- Slug.
- Description.
- Gender.
- Category.
- Material.
- Fit.
- Pattern.
- Care Instruction.
- Size guide.
- Normal price.
- Sold count.
- Flash Sale status.
- Product images.
- Active/archive status.

Gender:

```text
MEN
WOMEN
UNISEX
```

Category:

```text
T-SHIRT
SHIRT
PANTS
JEANS
OUTERWEAR
```

## 6.3 Product Variant

Setiap produk dapat memiliki beberapa variant.

Variant minimal memiliki:

```text
color
size
SKU
weight
stock
```

Pelanggan wajib memilih variant sebelum Add to Cart.

## 6.4 Search, Filter & Sort

Customer dapat:

### Search
- Search berdasarkan nama produk.

### Filter
- Gender.
- Category.
- Size.
- Color.
- Price.
- Availability.

### Sort
Minimal:
- Terbaru.
- Harga terendah.
- Harga tertinggi.

## 6.5 Sold Count

Product card dan product detail menampilkan jumlah unit yang telah terjual.

Contoh:

```text
986 terjual
```

Aturan:

- Sold count dihitung berdasarkan jumlah unit, bukan jumlah order.
- Sold count bertambah setelah pembayaran berhasil.
- Cart tidak menambah sold count.
- Order belum dibayar tidak menambah sold count.
- Payment failed tidak menambah sold count.
- Payment expired tidak menambah sold count.
- Admin tidak bebas mengubah angka sold count.

## 6.6 New Arrival & Best Seller

Keduanya menggunakan manual merchandising.

### New Arrival

Admin dapat mengatur:

```text
New Arrival = ON/OFF
```

Sistem tidak otomatis menentukan berdasarkan tanggal produk dibuat.

### Best Seller

Admin dapat mengatur:

```text
Best Seller = ON/OFF
```

Sistem tidak otomatis menentukan berdasarkan sold count.

## 6.7 Regular Discount

Admin dapat membuat discount:

- Percentage.
- Nominal.
- Start date/time.
- End date/time.

Harga akhir dihitung backend.

## 6.8 Flash Sale

### Scope

Flash Sale diterapkan pada produk, bukan individual variant.

Jika admin memilih satu produk, seluruh variant produk tersebut otomatis mengikuti Flash Sale.

Contoh:

```text
Oversized T-Shirt

Black / S
Black / M
Black / L
White / S
White / M
White / L
```

### Configuration

Admin mengatur:

- Product.
- Flash Sale price.
- Start date/time.
- End date/time.
- Active/inactive.

### Pricing

Satu harga Flash Sale berlaku untuk seluruh variant produk.

Contoh:

```text
Harga normal: Rp199.000
Flash Sale: Rp149.000

Black/S   → Rp149.000
Black/M   → Rp149.000
Black/L   → Rp149.000
White/S   → Rp149.000
White/M   → Rp149.000
White/L   → Rp149.000
```

### Stock

Tidak ada stock limit khusus Flash Sale.

Flash Sale menggunakan stock normal masing-masing variant.

### Discount Priority

Flash Sale menggantikan regular discount selama periode Flash Sale aktif.

```text
Jika Flash Sale aktif:
    gunakan Flash Sale price
Jika tidak:
    gunakan regular discount jika aktif
Jika tidak:
    gunakan normal price
```

Tidak ada stacking antara Flash Sale dan regular discount.

Aturan penggunaan voucher bersama Flash Sale masih menjadi Open Question.

### Countdown

Store menampilkan countdown berdasarkan waktu server/backend.

## 6.9 Voucher

Admin dapat membuat voucher minimal dengan:

- Voucher code.
- Percentage atau nominal.
- Start date/time.
- End date/time.
- Active/inactive.
- Usage limit jika digunakan.

Customer dapat memasukkan voucher pada checkout.

Backend melakukan validasi kode, periode, syarat, dan penggunaan voucher.

## 6.10 Cart

Customer dapat:

- Add product variant.
- Mengubah quantity.
- Menghapus item.
- Melihat subtotal.
- Melihat discount.
- Melihat total sementara.

Cart dapat bertahan ketika browser di-refresh.

Backend melakukan validasi ulang harga dan stok ketika checkout.

## 6.11 Guest Checkout

Customer tidak perlu login.

Data wajib:

- Nama penerima.
- WhatsApp.
- Email.
- Provinsi.
- Kota/kabupaten.
- Kecamatan.
- Kode pos.
- Alamat lengkap.
- Kurir.
- Service.

Catatan pesanan bersifat opsional.

Flow:

```text
Cart
 ↓
Checkout
 ↓
Shipping rate
 ↓
Select shipping
 ↓
Review order
 ↓
Create order
 ↓
QRIS
 ↓
Payment
```

## 6.12 Shipping

Shipping API digunakan untuk menghitung:

- Shipping service.
- Shipping cost.
- Estimasi pengiriman.

Provider shipping final masih TBD dan harus diputuskan sebelum production.

Backend tidak boleh menggunakan ongkir tebakan apabila shipping API gagal.

## 6.13 QRIS — DOKU

Payment production menggunakan DOKU QRIS.

Development dapat menggunakan mock/dummy payment.

Production wajib:

- DOKU QRIS.
- Payment callback/webhook.
- Server-side verification.
- Idempotency.
- Payment expiry.
- Payment status synchronization.

Status:

```text
PENDING → PAID
PENDING → EXPIRED
PENDING → FAILED
```

Durasi expiry QRIS DOKU final masih perlu dikonfirmasi berdasarkan konfigurasi production.

## 6.14 Order Tracking

Customer dapat tracking tanpa login menggunakan secure access token.

Informasi:

- Order number.
- Item.
- Payment status.
- Order status.
- Courier.
- Shipping service.
- Resi.
- Status fulfillment.

Nomor order saja tidak boleh menjadi credential untuk membuka data pribadi.

## 6.15 Admin Product Management

Admin dapat:

- Create product.
- Edit product.
- Archive product.
- Create variant.
- Edit variant.
- Set SKU.
- Set size.
- Set color.
- Set weight.
- Set stock.
- Upload image.
- Reorder image.
- Set primary image.
- Set price.
- Set discount.
- Set Flash Sale.
- Set New Arrival.
- Set Best Seller.

Image menggunakan Cloudinary signed upload.

## 6.16 Admin Inventory

Admin dapat:

- Melihat stok per variant.
- Menambah stok.
- Mengurangi stok.
- Melakukan adjustment.
- Memberikan alasan adjustment.

Sistem mencatat inventory movement.

## 6.17 Admin Order

Admin dapat:

- Melihat order.
- Filter order berdasarkan status.
- Membuka detail order.
- Melihat payment status.
- Melihat shipping information.
- Mengubah fulfillment status.
- Memasukkan nomor resi.

Status:

```text
WAITING_PAYMENT
PROCESSING
PACKED
SHIPPED
DELIVERED
CANCELLED
```

## 6.18 Production Readiness

Development dapat menggunakan mock/dummy untuk payment dan shipping.

Sebelum production:

- DOKU harus terintegrasi.
- Shipping API harus terintegrasi.
- Admin harus berjalan end-to-end.
- Store harus berjalan end-to-end.
- Backend API harus berjalan end-to-end.
- Deployment harus aktif.
- Database production harus aktif.
- Testing harus selesai.
- Payment harus diuji.
- Shipping harus diuji.
- Inventory harus diuji.
- Order lifecycle harus diuji.

---

# 7. Data Model Sketch

## 7.1 products

```text
id
name
slug
description
gender
category_id
material
fit
pattern
care_instruction
size_guide
normal_price
sold_count
is_new
is_best_seller
status
created_at
updated_at
```

## 7.2 categories

```text
id
name
slug
status
```

## 7.3 product_variants

```text
id
product_id
color
size
sku
weight
stock
status
created_at
updated_at
```

## 7.4 product_images

```text
id
product_id
cloudinary_public_id
url
sort_order
is_primary
created_at
```

## 7.5 discounts

```text
id
product_id
type
value
start_at
end_at
status
```

## 7.6 flash_sales

```text
id
name
price
start_at
end_at
status
```

Relasi:

```text
flash_sale_products
-------------------
id
flash_sale_id
product_id
```

Flash Sale tidak menggunakan relasi individual ke variant karena seluruh variant dari product yang dipilih mengikuti satu harga Flash Sale.

## 7.7 vouchers

```text
id
code
type
value
start_at
end_at
usage_limit
used_count
status
```

## 7.8 orders

```text
id
order_number
access_token
customer_name
customer_whatsapp
customer_email
shipping_address
shipping_service
shipping_cost
subtotal
discount_total
voucher_discount
grand_total
payment_status
fulfillment_status
created_at
updated_at
```

## 7.9 order_items

```text
id
order_id
product_id
variant_id
product_name_snapshot
variant_snapshot
sku_snapshot
normal_price_snapshot
selling_price_snapshot
discount_snapshot
quantity
subtotal
```

## 7.10 payments

```text
id
order_id
provider
external_transaction_id
status
amount
expires_at
paid_at
created_at
```

## 7.11 shipments

```text
id
order_id
courier
service
shipping_cost
estimated_delivery
tracking_number
status
```

## 7.12 inventory_movements

```text
id
variant_id
type
quantity
reason
reference_id
created_at
```

## 7.13 store_settings

```text
id
store_name
store_address
shipping_origin
package_weight
contact
updated_at
```

Store location dikelola pada store settings karena lokasi yang ditampilkan merupakan lokasi toko, bukan lokasi individual produk.

## 7.14 homepage_sections

```text
id
section_type
title
sort_order
is_active
```

Digunakan untuk mengelola section homepage.

---

# 8. Edge Cases and Failure States

| Kondisi | Expected Behavior |
|---|---|
| Variant out of stock | Add to cart/checkout ditolak |
| Stock berubah saat checkout | Backend melakukan validasi ulang |
| Dua customer membeli stok terakhir | Hanya transaksi yang berhasil melakukan reservation yang mendapatkan stok |
| Harga berubah saat checkout | Backend menghitung ulang harga |
| Flash Sale belum dimulai | Harga Flash Sale tidak digunakan |
| Flash Sale sudah berakhir | Harga kembali ke regular pricing |
| Flash Sale aktif | Harga Flash Sale menggantikan regular discount |
| Produk memiliki banyak variant | Semua variant menggunakan satu Flash Sale price |
| Variant memiliki stok berbeda | Masing-masing menggunakan stok normalnya |
| Payment gagal | Order tidak menjadi PAID |
| Payment expired | Reservation dilepas |
| Webhook dikirim dua kali | Tidak boleh mengurangi stok dua kali |
| Webhook tidak valid | Ditolak |
| Shipping API gagal | Checkout tidak menggunakan ongkir tebakan |
| Voucher invalid | Voucher tidak diterapkan |
| Voucher expired | Voucher tidak diterapkan |
| Product diarsipkan | Tidak muncul di katalog tetapi histori order tetap ada |
| Gambar gagal upload | Admin mendapat error dan dapat retry |
| API tidak tersedia | Store menampilkan error state |
| Product list kosong | Store menampilkan empty state |
| Search tidak menemukan produk | Store menampilkan empty result |
| Tracking token invalid | Data order tidak ditampilkan |
| Admin tidak terautentikasi | Admin API mengembalikan unauthorized/forbidden |

### Flash Sale Conflict

Belum ditentukan bagaimana sistem menangani dua Flash Sale pada produk yang sama dengan periode overlap.

---

# 9. Success Metrics

## 9.1 Customer Metrics

### Product Discovery

- Product list view.
- Product detail view.
- Search usage.
- Filter usage.
- Product detail → add-to-cart rate.

### Purchase Funnel

```text
Product View
     ↓
Add to Cart
     ↓
Checkout
     ↓
Order Created
     ↓
QRIS Displayed
     ↓
Payment Success
```

Metric:

- Add-to-cart rate.
- Checkout initiation rate.
- Checkout completion rate.
- Payment success rate.
- Payment expiry rate.
- Order cancellation rate.

## 9.2 Business Metrics

- Total orders.
- Total units sold.
- Revenue.
- Average order value.
- Produk dengan unit terjual terbanyak.
- Flash Sale conversion.
- Voucher usage.
- Discount usage.
- Stock-out frequency.

## 9.3 Operational Metrics

- Payment webhook failure rate.
- Shipping API failure rate.
- Payment reconciliation issue.
- Inventory discrepancy.
- Order processing time.
- API error rate.

## 9.4 Technical Success Criteria

MVP berhasil apabila:

- Store dapat digunakan di mobile dan desktop.
- Admin dapat mengelola produk dan order.
- Backend menjadi source of truth.
- Tidak ada direct business database access dari Store/Admin.
- Checkout dapat dilakukan tanpa akun.
- Payment dapat diverifikasi secara server-side.
- Inventory tidak mengalami overselling pada alur utama.
- Flash Sale berjalan sesuai periode dan harga.
- DOKU, shipping, deployment, testing, dan Admin dapat berjalan end-to-end sebelum production.

---

# 10. Open Questions

| # | Open Question | Dampak |
|---|---|---|
| 1 | Apakah voucher boleh digunakan ketika produk sedang Flash Sale? | Menentukan aturan stacking promo |
| 2 | Apakah satu produk boleh memiliki lebih dari satu Flash Sale yang periodenya overlap? | Menentukan validation dan data model promo |
| 3 | Jika overlap tidak diperbolehkan, apakah sistem menolak campaign baru atau menonaktifkan campaign lama? | Menentukan behavior Admin |
| 4 | Provider shipping API final yang digunakan apa? | Integrasi production dan biaya |
| 5 | Berapa lama masa berlaku pembayaran QRIS DOKU? | Payment expiry dan stock reservation |
| 6 | Apakah voucher memiliki minimum purchase? | Business rule voucher |
| 7 | Apakah voucher memiliki batas penggunaan per customer? | Data model dan validation voucher |
| 8 | Apakah size guide wajib untuk semua produk atau hanya produk tertentu? | Product form dan data validation |
| 9 | Format tampilan lokasi toko pada product card seperti apa? | UI product card |
| 10 | Apakah homepage section dapat diubah urutannya oleh Admin? | Homepage management UI |
| 11 | Berapa maksimum gambar dan ukuran file per produk? | Cloudinary dan validation |
| 12 | Berapa berat kemasan default? | Akurasi perhitungan ongkir |
| 13 | Bagaimana kebijakan retur/refund final? | Halaman policy dan operational flow |
| 14 | Apakah notifikasi WhatsApp masuk MVP? | Integrasi eksternal dan biaya |

**Review & Rating tidak lagi menjadi Open Question karena sudah diputuskan masuk V2.**

---

# Final Product Boundary

```text
                         BLISSFY
                            │
             ┌──────────────┴──────────────┐
             │                             │
          CUSTOMER                       ADMIN
             │                             │
        Store Frontend                Admin Frontend
             │                             │
             └──────────────┬──────────────┘
                            │
                       Backend API
                          NestJS
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Products          Orders           Promotion
          │                 │          ┌──────┴──────┐
       Variants          Payment      Discount    Flash Sale
          │                 │                       │
       Inventory          DOKU              Product-level
          │                                       │
          └─────────────────┬─────────────────────┘
                            │
                    Supabase PostgreSQL
                            │
                      Cloudinary
                            │
                      Shipping API
```

## Aturan Flash Sale Final

**Admin memilih produk → seluruh variant produk mengikuti Flash Sale → satu harga Flash Sale berlaku untuk semua variant → tidak ada stok khusus Flash Sale → stok menggunakan stok normal variant → Flash Sale menggantikan regular discount selama periode aktif.**

## Pembagian Scope Final

### MVP
Catalog, search/filter, variant, cart, guest checkout, shipping, DOKU QRIS, order tracking, admin, inventory, discount, voucher, Flash Sale, homepage management, sold count, New Arrival manual, Best Seller manual.

### V2
Customer account, login/register, order history, saved address, wishlist, **Review & Rating**, automatic shipment tracking, notification, related products, recently viewed.

### Later
Loyalty, referral, personalized recommendation, AI recommendation, mobile app, multi-vendor, marketplace integration, advanced CRM.

---

# Definition of Done

MVP dianggap selesai apabila:

- Customer dapat membeli tanpa akun.
- Store dan Admin berjalan sebagai aplikasi terpisah.
- Backend NestJS berjalan sebagai API terpisah.
- Store/Admin tidak melakukan direct mutation ke database bisnis.
- Harga, diskon, voucher, Flash Sale, ongkir, total, stok, dan status divalidasi backend.
- Flash Sale menerapkan satu harga untuk seluruh variant produk yang dipilih.
- Tidak terdapat stock limit khusus Flash Sale.
- Payment production menggunakan DOKU QRIS.
- Shipping production menggunakan provider yang telah dipilih.
- Payment webhook valid, invalid, duplicate, dan expired telah diuji.
- Order creation dan stock reservation aman dari duplicate/overselling utama.
- Admin dapat mengelola produk, gambar, inventory, promosi, homepage, order, dan resi.
- Customer dapat melacak order melalui secure access token.
- Secret tidak terdapat di repository atau frontend bundle.
- Database migration terdokumentasi.
- OpenAPI backend tersedia.
- Logging dan error handling tersedia.
- Unit, integration, API E2E, dan frontend E2E untuk alur kritis tersedia.
- Store, Admin, API, payment, shipping, dan database dapat berjalan end-to-end.
- Deployment production telah diuji.
- Dokumentasi setup, environment variables, architecture, API, dan deployment tersedia.

---

# Persetujuan Dokumen

PRD Final Blissfy.co menjadi acuan utama untuk UI/UX, technical design, database design, backlog, testing, dan implementasi.

Perubahan yang memengaruhi payment, inventory, order lifecycle, data pelanggan, promotion/Flash Sale, atau boundary Store/Admin/API harus dicatat sebagai revisi PRD atau Architecture Decision Record.
