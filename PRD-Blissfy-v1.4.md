# Product Requirements Document (PRD)

## Blissfy.co Fashion E-Commerce Web Application

| Informasi | Detail |
| --- | --- |
| Status dokumen | Draft v1.4 - Clean Architecture & Monorepo Backend |
| Tanggal | 19 Agustus 2026 |
| Revisi dari | v1.3 (19 Agustus 2026) |
| Nama produk/merek | Blissfy.co |
| Jenis produk | Single-store fashion e-commerce |
| Platform | Web responsif |
| Target rilis | MVP / portfolio-ready / production-ready |
| Deployment awal | Store, Admin, dan API sebagai deployment terpisah |
| Pemilik bisnis | Satu pemilik sekaligus admin |

> **Catatan revisi v1.4:** Arsitektur aplikasi diubah dari satu Next.js full-stack menjadi **satu monorepo dengan tiga aplikasi terpisah**: Store Frontend, Admin Frontend, dan Backend API. Backend menjadi sumber kebenaran tunggal untuk business logic, persistence, payment, shipping, inventory, dan integrasi eksternal. Backend menggunakan **NestJS**, pola **modular monolith**, dan **clean architecture pragmatis**. Store dan Admin tidak mengakses database bisnis secara langsung.

---

## 1. Ringkasan Produk

Blissfy.co adalah web e-commerce fashion untuk satu bisnis yang menjual produk milik sendiri. Pelanggan dapat melihat katalog, memilih ukuran dan warna, memasukkan produk ke keranjang, menghitung ongkos kirim ke seluruh Indonesia, serta menyelesaikan pembayaran QRIS tanpa membuat akun pelanggan.

Sistem menggunakan QRIS dinamis dan webhook payment gateway agar pembayaran dapat dikonfirmasi secara otomatis. Admin tidak perlu memeriksa mutasi rekening secara manual. Setelah pembayaran berhasil, backend memperbarui status pembayaran, status pesanan, dan status stok secara konsisten.

Blissfy.co dibangun untuk dua tujuan yang sama penting:

1. Menjadi e-commerce yang benar-benar dapat digunakan oleh toko Blissfy.co.
2. Menjadi portfolio software engineering yang menunjukkan kemampuan frontend, backend, API design, database design, clean architecture, security, payment integration, dan deployment.

Untuk menjaga maintainability, sistem dibangun dalam **satu monorepo**, tetapi dipisahkan menjadi tiga aplikasi:

- **Store Frontend** untuk pelanggan.
- **Admin Frontend** untuk operasional toko.
- **Backend API** sebagai pusat business logic dan akses data.

Backend menggunakan pola **modular monolith**, bukan microservices. Modul bisnis seperti produk, inventori, order, pembayaran, dan pengiriman dipisahkan secara internal, namun tetap berjalan sebagai satu aplikasi backend agar operasional dan maintenance tetap sederhana.

### 1.1 Identitas produk

- **Nama merek:** Blissfy.co
- **Kategori:** Fashion e-commerce
- **Model bisnis:** Single store, menjual produk milik sendiri
- **Font utama antarmuka:** Poppins
- **Channel awal:** Web responsif
- **Positioning awal:** Toko fashion modern dengan pengalaman belanja sederhana, jelas, dan terpercaya
- **Wordmark:** Teks `Blissfy.co`; tidak menggunakan logo grafis
- **Alamat asal:** Jl. Mahoni, Temu Ireng, Sukorejo, Kec. Ulujami, Kabupaten Pemalang, Jawa Tengah 52371
- **Kurir MVP:** J&T dan JNE
- **Database:** Supabase PostgreSQL
- **Model persediaan:** Ready stock saja
- **Arsitektur aplikasi:** Satu monorepo, tiga aplikasi terpisah (`store`, `admin`, `api`)
- **Arsitektur backend:** NestJS modular monolith + clean architecture pragmatis
- **Integrasi gambar:** Cloudinary signed upload
- **Payment gateway:** Midtrans QRIS

---

## 2. Latar Belakang dan Masalah

Calon pelanggan toko fashion sering mengalami hambatan ketika diwajibkan membuat akun sebelum membeli. Proses registrasi memperpanjang checkout dan dapat meningkatkan kemungkinan pelanggan membatalkan pembelian.

Di sisi operasional, konfirmasi pembayaran dan pengelolaan stok secara manual memiliki beberapa masalah:

- Admin harus mencocokkan pembayaran secara manual.
- Pembayaran dapat terlambat diproses.
- Risiko kesalahan pencocokan pembayaran meningkat.
- Stok dapat tidak akurat ketika beberapa pelanggan membeli varian terakhir secara bersamaan.
- Ongkos kirim sulit dihitung konsisten tanpa integrasi layanan pengiriman.
- Pengelolaan foto produk melalui URL manual rawan kesalahan.
- Business logic yang ditempatkan langsung di layer UI sulit diuji, dikembangkan, dan dirawat ketika fitur bertambah.
- Store dan Admin yang terlalu bergantung pada implementasi database menyulitkan perubahan teknologi atau penambahan client baru di masa depan.

Blissfy.co menyelesaikan masalah tersebut melalui guest checkout, perhitungan ongkir otomatis, reservasi stok, QRIS dinamis, webhook pembayaran, upload gambar langsung, serta **backend API terpusat yang memisahkan business logic dari presentation layer**.

---

## 3. Tujuan Produk

### 3.1 Tujuan utama

1. Memungkinkan pelanggan membeli produk tanpa registrasi dan login.
2. Memungkinkan pembayaran menggunakan QRIS dinamis dengan batas waktu 10 menit.
3. Memperbarui status pembayaran secara otomatis melalui webhook.
4. Menghitung ongkos kirim otomatis untuk tujuan di seluruh Indonesia.
5. Mengelola produk berdasarkan variasi ukuran, warna, SKU, berat, dan stok.
6. Mendukung harga normal serta diskon berbasis persentase atau nominal.
7. Memberikan dashboard admin untuk katalog, stok, pesanan, pembayaran, pengiriman, dan upload gambar.
8. Menjadi aplikasi yang layak dipakai untuk bisnis sungguhan.
9. Menjadi portfolio backend yang menunjukkan API design, clean architecture, modularity, transaction handling, webhook, concurrency, dan security.
10. Memisahkan Store UI, Admin UI, dan Backend API agar perubahan pada satu area tidak memaksa perubahan besar pada area lainnya.
11. Menjaga seluruh aplikasi tetap mudah dirawat melalui satu monorepo dan shared contract yang terkontrol.
12. Menyiapkan backend agar client lain seperti aplikasi mobile dapat ditambahkan tanpa menduplikasi business logic.

### 3.2 Indikator keberhasilan MVP

- Pelanggan dapat menyelesaikan pesanan tanpa akun dari katalog hingga pembayaran.
- Ongkir berasal dari API pengiriman, bukan nilai statis.
- Pembayaran sukses memperbarui status pesanan tanpa tindakan manual admin.
- Transaksi yang tidak dibayar dalam 10 menit menjadi kedaluwarsa.
- Reservasi stok dilepas ketika pembayaran kedaluwarsa.
- Admin dapat mengelola katalog dan memproses pesanan sampai nomor resi.
- Admin dapat mengunggah foto produk langsung tanpa input URL manual.
- Pelanggan dapat melihat status pesanan melalui tautan rahasia.
- Store dan Admin tidak mengakses tabel bisnis secara langsung.
- Backend menjadi source of truth untuk harga, diskon, stok, order, payment, shipping, dan authorization.
- Modul backend dapat diuji secara unit dan integration test tanpa bergantung pada UI.
- Seluruh alur utama berjalan baik pada perangkat mobile dan desktop.

---

## 4. Ruang Lingkup

### 4.1 Termasuk dalam MVP

- Single-store fashion e-commerce.
- Katalog dan detail produk.
- Kategori produk.
- Pencarian dan filter produk.
- Varian ukuran dan warna.
- SKU dan stok per varian.
- Harga normal dan diskon produk.
- Keranjang tanpa akun.
- Guest checkout.
- Alamat pengiriman seluruh Indonesia.
- Perhitungan ongkir otomatis berdasarkan lokasi dan berat.
- QRIS dinamis.
- Masa pembayaran 10 menit.
- Webhook pembayaran otomatis.
- Reservasi stok selama menunggu pembayaran.
- Pelacakan status pesanan tanpa login.
- Admin dashboard sebagai aplikasi frontend terpisah.
- Backend REST API sebagai aplikasi terpisah.
- Upload gambar langsung ke Cloudinary menggunakan signed upload.
- Nomor resi dimasukkan manual oleh admin.
- Halaman kebijakan dasar toko.
- Satu monorepo dengan Store, Admin, dan API.
- OpenAPI/Swagger untuk dokumentasi backend.
- Logging dan audit untuk operasi sensitif.

### 4.2 Tidak termasuk dalam MVP

- Marketplace atau multi-vendor.
- Akun pelanggan.
- Loyalty point atau membership.
- Wishlist lintas perangkat.
- Voucher kompleks dan referral.
- Pembayaran kartu, VA, COD, atau paylater.
- Chat langsung dalam aplikasi.
- Multi-admin dan role-based access control kompleks.
- Microservices.
- Database terpisah untuk Store dan Admin.
- Backend business logic di dalam Next.js Route Handlers.
- Akses langsung Store/Admin ke tabel bisnis Supabase.
- Pembuatan label pengiriman/AWB otomatis.
- Refund otomatis.
- Retur mandiri melalui dashboard pelanggan.
- Integrasi marketplace eksternal.
- Rekomendasi produk berbasis AI.

---

## 5. Pengguna dan Persona

### 5.1 Pelanggan

Pelanggan ingin membeli produk fashion dengan cepat melalui ponsel atau desktop tanpa membuat akun.

**Kebutuhan pelanggan:**

- Menemukan produk dengan mudah.
- Melihat foto dan informasi produk akurat.
- Mengetahui ukuran dan warna tersedia.
- Mengetahui harga akhir sebelum membayar.
- Mendapatkan pilihan layanan pengiriman dan ongkir.
- Membayar melalui QRIS.
- Mendapatkan status pesanan tanpa login.

### 5.2 Admin

Admin adalah pemilik atau pengelola tunggal toko.

**Kebutuhan admin:**

- Login ke dashboard yang terpisah dari storefront.
- Mengelola produk, kategori, varian, harga, diskon, berat, dan stok.
- Mengunggah foto produk langsung dari perangkat.
- Mengetahui pesanan yang sudah dibayar.
- Melihat detail penerima dan layanan pengiriman.
- Mengubah status fulfillment.
- Memasukkan nomor resi.
- Melihat transaksi bermasalah atau kedaluwarsa.
- Melihat ringkasan penjualan dasar.

---

## 6. User Journey Utama

### 6.1 Journey pembelian berhasil

1. Pelanggan membuka Store Frontend.
2. Store mengambil katalog dari Backend API.
3. Pelanggan membuka detail produk.
4. Pelanggan memilih warna, ukuran, dan jumlah.
5. Store menambahkan item ke cart lokal.
6. Pelanggan membuka checkout.
7. Pelanggan mengisi identitas dan alamat penerima.
8. Store meminta pilihan ongkir ke Backend API.
9. Backend mengambil tarif dari provider pengiriman.
10. Pelanggan memilih layanan kurir.
11. Store mengirim permintaan pembuatan order ke Backend API.
12. Backend menghitung ulang harga, diskon, stok, berat, ongkir, dan total.
13. Backend membuat order dan menahan stok dalam transaksi database.
14. Backend membuat transaksi QRIS melalui Midtrans.
15. Backend mengembalikan informasi pembayaran ke Store.
16. Pelanggan memindai QRIS dan membayar.
17. Midtrans mengirim webhook ke Backend API.
18. Backend memverifikasi webhook dan memperbarui payment/order secara idempotent.
19. Admin melihat pesanan berstatus dibayar pada Admin Frontend.
20. Admin menyiapkan dan mengirim pesanan.
21. Admin memasukkan nomor resi melalui Backend API.
22. Pelanggan melihat status terbaru melalui token rahasia.

### 6.2 Journey pembayaran kedaluwarsa

1. Backend menyimpan `expires_at` selama 10 menit.
2. Pelanggan tidak membayar hingga batas waktu.
3. Gateway mengirim status kedaluwarsa atau scheduled reconciliation mendeteksinya.
4. Backend mengubah payment menjadi `EXPIRED`.
5. Backend melepaskan reservasi stok secara idempotent.
6. Pelanggan dapat meminta pembayaran baru.
7. Backend memeriksa ulang harga, stok, diskon, dan ongkir sebelum membuat transaksi baru.

### 6.3 Journey admin mengunggah foto produk

1. Admin membuka form produk pada Admin Frontend.
2. Admin memilih atau drag-and-drop gambar.
3. Admin Frontend memvalidasi tipe dan ukuran awal.
4. Admin meminta signed upload parameter ke Backend API.
5. Backend memastikan sesi admin valid lalu membuat signature Cloudinary.
6. Browser mengunggah file langsung ke Cloudinary.
7. Cloudinary mengembalikan metadata upload.
8. Admin Frontend mengirim metadata tersebut ke Backend API.
9. Backend memverifikasi metadata dan menyimpannya ke `product_images`.
10. Admin dapat mengatur urutan, gambar utama, dan menghapus gambar.

---

## 7. Kebutuhan Fungsional

### 7.1 Katalog produk

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-PROD-01 | Backend menyediakan daftar produk aktif melalui REST API. | Must |
| FR-PROD-02 | Store menampilkan nama, foto utama, harga normal, harga diskon, dan status stok. | Must |
| FR-PROD-03 | Detail produk dapat dibuka melalui slug unik. | Must |
| FR-PROD-04 | Detail menampilkan galeri, deskripsi, ukuran, warna, harga, dan panduan ukuran. | Must |
| FR-PROD-05 | Pelanggan dapat mencari produk berdasarkan nama. | Must |
| FR-PROD-06 | Pelanggan dapat memfilter kategori, ukuran, warna, harga, dan ketersediaan. | Should |
| FR-PROD-07 | Backend menolak pembelian varian yang stoknya tidak tersedia. | Must |
| FR-PROD-08 | Store tidak melakukan query produk langsung ke database. | Must |

### 7.2 Keranjang belanja

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-CART-01 | Pelanggan dapat menambah varian ke keranjang. | Must |
| FR-CART-02 | Pelanggan dapat mengubah jumlah atau menghapus produk. | Must |
| FR-CART-03 | Keranjang disimpan di browser agar bertahan saat reload. | Must |
| FR-CART-04 | Store dapat menampilkan estimasi subtotal dan penghematan. | Must |
| FR-CART-05 | Backend selalu memvalidasi ulang harga dan stok saat checkout. | Must |
| FR-CART-06 | Perubahan harga atau stok ditampilkan sebelum order dibuat. | Must |

### 7.3 Guest checkout

Data wajib:

- Nama penerima.
- Nomor WhatsApp aktif.
- Email aktif.
- Provinsi.
- Kota/kabupaten.
- Kecamatan.
- Kode pos.
- Alamat lengkap.
- Pilihan kurir dan layanan.

Opsional:

- Catatan pesanan.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-CHK-01 | Checkout dapat dilakukan tanpa autentikasi pelanggan. | Must |
| FR-CHK-02 | Backend memvalidasi seluruh data checkout. | Must |
| FR-CHK-03 | Pelanggan menyetujui syarat pembelian dan kebijakan privasi. | Must |
| FR-CHK-04 | Store menampilkan ringkasan final sebelum membuat order. | Must |
| FR-CHK-05 | Backend menjadi source of truth untuk harga, diskon, ongkir, dan total. | Must |
| FR-CHK-06 | Request pembuatan order menggunakan idempotency key. | Must |
| FR-CHK-07 | Email wajib dan divalidasi. | Must |

### 7.4 Harga dan diskon

MVP mendukung diskon persentase dan nominal pada tingkat produk.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-DISC-01 | Admin dapat menentukan harga normal produk. | Must |
| FR-DISC-02 | Admin dapat memilih diskon persentase atau nominal. | Must |
| FR-DISC-03 | Admin dapat menentukan waktu mulai dan berakhir diskon. | Must |
| FR-DISC-04 | Backend hanya menerapkan diskon aktif saat transaksi. | Must |
| FR-DISC-05 | Harga diskon tidak boleh nol atau negatif akibat konfigurasi salah. | Must |
| FR-DISC-06 | Harga normal, diskon, dan harga jual disalin ke order item. | Must |
| FR-DISC-07 | Perubahan harga setelah order dibuat tidak mengubah histori order. | Must |
| FR-DISC-08 | Frontend tidak menentukan nilai final yang dipercaya backend. | Must |

Rumus awal:

```text
Subtotal kotor = jumlah x harga normal
Diskon produk = perhitungan diskon aktif
Subtotal bersih = subtotal kotor - diskon produk
Total pembayaran = subtotal bersih + ongkos kirim
```

### 7.5 Pengiriman dan ongkos kirim

Perhitungan ongkir dilakukan melalui RajaOngkir/Komerce untuk layanan J&T dan JNE.

Alamat asal:

```text
Jl. Mahoni, Temu Ireng, Sukorejo,
Kec. Ulujami, Kabupaten Pemalang,
Jawa Tengah 52371
```

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-SHIP-01 | Backend menggunakan alamat asal Blissfy.co yang dikonfigurasi. | Must |
| FR-SHIP-02 | Setiap produk/varian memiliki berat dalam gram. | Must |
| FR-SHIP-03 | Backend menghitung berat total + berat kemasan. | Must |
| FR-SHIP-04 | Backend mengambil tarif pengiriman dari provider. | Must |
| FR-SHIP-05 | Store menampilkan layanan J&T/JNE yang dikembalikan backend. | Must |
| FR-SHIP-06 | Sistem menampilkan biaya dan estimasi dari provider. | Must |
| FR-SHIP-07 | Tarif terpilih disalin sebagai snapshot ke order. | Must |
| FR-SHIP-08 | Jika API gagal, backend tidak boleh menebak tarif atau memakai nol. | Must |
| FR-SHIP-09 | Admin dapat memasukkan nomor resi. | Must |
| FR-SHIP-10 | Integrasi pelacakan otomatis dapat ditambahkan setelah MVP. | Could |

### 7.6 Pembayaran QRIS

Payment gateway awal: Midtrans.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-PAY-01 | Backend membuat transaksi gateway untuk order. | Must |
| FR-PAY-02 | Store menampilkan QRIS, total, nomor order, dan countdown. | Must |
| FR-PAY-03 | Masa berlaku pembayaran 10 menit. | Must |
| FR-PAY-04 | Waktu kedaluwarsa disimpan di database dan gateway. | Must |
| FR-PAY-05 | Backend menerima webhook HTTPS dari Midtrans. | Must |
| FR-PAY-06 | Backend memverifikasi signature, transaction ID, dan nominal. | Must |
| FR-PAY-07 | Hanya event server-side yang valid dapat menandai order lunas. | Must |
| FR-PAY-08 | Pemrosesan webhook idempotent. | Must |
| FR-PAY-09 | Event webhook disimpan untuk audit. | Must |
| FR-PAY-10 | Pelanggan dapat retry payment setelah expired. | Must |
| FR-PAY-11 | Backend menyediakan reconciliation sebagai fallback. | Should |
| FR-PAY-12 | Store/Admin tidak memiliki Midtrans server key. | Must |

Status pembayaran:

```text
PENDING -> PAID
PENDING -> EXPIRED
PENDING -> FAILED
PAID -> REFUNDED (fase berikutnya/manual)
```

### 7.7 Reservasi dan manajemen stok

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-STOCK-01 | Setiap varian memiliki SKU unik dan stok. | Must |
| FR-STOCK-02 | Backend menahan stok saat transaksi pembayaran berhasil dibuat. | Must |
| FR-STOCK-03 | Reservasi berlaku maksimal 10 menit. | Must |
| FR-STOCK-04 | Pembayaran sukses mengonversi reservasi menjadi penjualan. | Must |
| FR-STOCK-05 | Pembayaran expired melepaskan reservasi. | Must |
| FR-STOCK-06 | Operasi stok memakai transaction/locking yang sesuai. | Must |
| FR-STOCK-07 | Event ganda tidak boleh mengurangi stok dua kali. | Must |
| FR-STOCK-08 | Admin dapat melakukan penyesuaian stok dengan alasan. | Should |
| FR-STOCK-09 | Sistem hanya mendukung ready stock. | Must |
| FR-STOCK-10 | Semua perubahan stok dicatat sebagai inventory movement. | Must |

### 7.8 Pesanan dan pelacakan tanpa akun

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-ORD-01 | Sistem membuat nomor order mudah dibaca namun tidak menjadi credential akses. | Must |
| FR-ORD-02 | Backend membuat access token berentropi tinggi untuk tracking. | Must |
| FR-ORD-03 | Pelanggan dapat membuka status melalui token tanpa login. | Must |
| FR-ORD-04 | Nomor order saja tidak cukup membuka data pribadi. | Must |
| FR-ORD-05 | Halaman menampilkan item, pembayaran, fulfillment, kurir, dan resi. | Must |
| FR-ORD-06 | Data pribadi ditampilkan seminimal mungkin. | Must |

Fulfillment status:

```text
WAITING_PAYMENT
PROCESSING
PACKED
SHIPPED
DELIVERED
CANCELLED
```

Payment status dan fulfillment status disimpan terpisah.

### 7.9 Admin Frontend

Admin dibangun sebagai aplikasi Next.js tersendiri di dalam monorepo.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-ADM-01 | Admin dapat login/logout dengan aman. | Must |
| FR-ADM-02 | Admin dapat membuat, mengubah, mengarsipkan, dan melihat produk. | Must |
| FR-ADM-03 | Admin dapat mengunggah gambar dari perangkat tanpa URL manual. | Must |
| FR-ADM-04 | Admin dapat mengelola kategori, varian, SKU, berat, dan stok. | Must |
| FR-ADM-05 | Admin dapat mengatur harga dan diskon. | Must |
| FR-ADM-06 | Admin dapat melihat/filter order berdasarkan status. | Must |
| FR-ADM-07 | Admin dapat membuka detail pembayaran dan pengiriman. | Must |
| FR-ADM-08 | Admin dapat mengubah fulfillment sesuai transisi yang diizinkan backend. | Must |
| FR-ADM-09 | Admin dapat memasukkan nomor resi. | Must |
| FR-ADM-10 | Admin dapat melihat ringkasan penjualan dasar. | Should |
| FR-ADM-11 | Admin dapat mengatur berat kemasan dan settings yang diizinkan. | Must |
| FR-ADM-12 | Tindakan sensitif dicatat dalam audit log. | Should |
| FR-ADM-13 | Admin Frontend tidak mengakses database bisnis secara langsung. | Must |
| FR-ADM-14 | Semua operasi mutasi dilakukan melalui authenticated Backend API. | Must |

### 7.10 Backend API

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-API-01 | Backend menggunakan NestJS dan REST API. | Must |
| FR-API-02 | Backend menggunakan struktur modular monolith. | Must |
| FR-API-03 | Business logic dipisahkan dari controller dan persistence. | Must |
| FR-API-04 | Modul bisnis mengikuti clean architecture pragmatis. | Must |
| FR-API-05 | API memiliki versioning minimal `/v1`. | Must |
| FR-API-06 | API menyediakan OpenAPI/Swagger. | Must |
| FR-API-07 | API memiliki error response yang konsisten. | Must |
| FR-API-08 | API memvalidasi input server-side. | Must |
| FR-API-09 | API menerapkan authentication/authorization untuk admin endpoint. | Must |
| FR-API-10 | API memiliki request/correlation ID untuk logging. | Should |
| FR-API-11 | API mendukung idempotency untuk operasi kritis seperti pembuatan order dan webhook. | Must |
| FR-API-12 | API menjadi satu-satunya layer yang boleh menjalankan business mutation terhadap tabel utama. | Must |

---

## 8. Aturan Bisnis

1. Toko hanya menjual produk milik Blissfy.co.
2. Pelanggan tidak wajib memiliki akun.
3. Satu checkout menghasilkan satu order dan maksimal satu pembayaran aktif pada satu waktu.
4. Harga, diskon, ongkir, dan total selalu dihitung ulang backend.
5. Ongkir harus berasal dari provider yang dikonfigurasi.
6. QRIS berlaku 10 menit sejak transaksi dibuat.
7. Stok ditahan selama masa pembayaran.
8. Order hanya dianggap lunas setelah backend memverifikasi event payment gateway.
9. Redirect browser bukan bukti pembayaran.
10. Transaksi expired tidak dapat ditandai lunas melalui UI admin biasa.
11. Retry payment harus memeriksa ulang harga, diskon, ongkir, dan stok.
12. Nilai historis order yang sudah dibayar tidak boleh berubah.
13. Produk diarsipkan tetap muncul pada histori order.
14. Nomor resi hanya dapat ditambahkan pada order yang dibayar.
15. Data pribadi hanya digunakan untuk transaksi, komunikasi, dan pengiriman.
16. Email pelanggan wajib.
17. Kurir MVP dibatasi J&T dan JNE.
18. Penjualan hanya ready stock.
19. Data pribadi pelanggan disimpan 2 bulan setelah `DELIVERED` atau `CANCELLED`, lalu dihapus/dianonimkan.
20. Data transaksi nonpersonal dapat dipertahankan untuk laporan.
21. Gambar produk hanya melalui upload resmi ke Cloudinary.
22. Admin Frontend tidak memiliki akses langsung ke database bisnis.
23. Store Frontend tidak memiliki akses langsung ke database bisnis.
24. Semua business mutation utama melalui Backend API.
25. Endpoint admin hanya dapat dipanggil oleh identitas admin yang tervalidasi.
26. Backend adalah source of truth untuk state order, payment, inventory, dan shipment.
27. Shared package tidak boleh membocorkan secret atau persistence implementation ke frontend.
28. Backend tetap modular monolith hingga ada kebutuhan operasional yang jelas untuk memecah service.

---

## 9. Rancangan Halaman

### 9.1 Store Frontend

```text
/
/products
/products/[slug]
/category/[slug]
/cart
/checkout
/payment/[accessToken]
/order/track
/order/[accessToken]
/about
/contact
/shipping-policy
/return-policy
/privacy-policy
/terms
```

### 9.2 Admin Frontend

```text
/login
/
/products
/products/new
/products/[id]
/products/[id]/images
/categories
/orders
/orders/[id]
/inventory
/settings
```

Admin berada pada host/deployment tersendiri, misalnya `admin.blissfy.co`.

### 9.3 Persyaratan UX utama

- Mobile-first dan responsif.
- Tombol tindakan utama jelas.
- Pemilihan ukuran/warna wajib sebelum add-to-cart.
- Harga normal, diskon, harga akhir, dan ongkir transparan.
- Checkout sesingkat mungkin.
- Error form dekat dengan field terkait.
- Payment page menampilkan QRIS, total, instruksi, dan countdown.
- Status pembayaran tidak bergantung refresh manual saja.
- Loading, empty, error, expired, dan out-of-stock memiliki state khusus.
- Admin upload memiliki drag-and-drop, progress, preview, reorder, dan primary image.

---

## 10. Arsitektur dan Teknologi

### 10.1 Stack utama

| Lapisan | Teknologi |
| --- | --- |
| Store Frontend | Next.js + React + TypeScript |
| Admin Frontend | Next.js + React + TypeScript |
| Styling | Tailwind CSS |
| Font | Poppins |
| Form | React Hook Form + schema validation |
| Client state | Zustand/local state sesuai kebutuhan |
| Backend | NestJS + TypeScript |
| API | REST + OpenAPI |
| Backend architecture | Modular Monolith + Clean Architecture pragmatis |
| Database | Supabase PostgreSQL |
| Authentication admin | Supabase Auth, diverifikasi backend |
| Database access | Server-side only dari Backend API |
| Image storage | Cloudinary signed upload |
| Payment | Midtrans QRIS |
| Shipping | RajaOngkir/Komerce |
| Monorepo | pnpm workspace + Turborepo |
| Database migration | Supabase SQL migrations |
| Email transaksi | Resend atau provider setara |

### 10.2 Struktur monorepo

```text
blissfy/
├── apps/
│   ├── store/
│   ├── admin/
│   └── api/
├── packages/
│   ├── contracts/
│   ├── types/
│   ├── validation/
│   ├── config/
│   ├── eslint-config/
│   └── tsconfig/
├── supabase/
│   └── migrations/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 10.3 Boundary aplikasi

#### Store Frontend bertanggung jawab atas

- Presentation/UI pelanggan.
- Client interaction.
- Cart state lokal.
- SEO.
- Memanggil Backend API.
- Menampilkan server state.

Store Frontend **tidak** bertanggung jawab atas:

- Query database bisnis.
- Perhitungan final harga.
- Manipulasi stok.
- Pembuatan transaksi payment gateway.
- Verifikasi webhook.
- Authorization admin.

#### Admin Frontend bertanggung jawab atas

- Presentation/UI admin.
- Product form.
- Order management UI.
- Inventory UI.
- Upload UI.
- Memanggil authenticated Backend API.

Admin Frontend **tidak** melakukan direct mutation terhadap database.

#### Backend API bertanggung jawab atas

- Business rules.
- Validation server-side.
- Authentication dan authorization backend.
- Product/catalog operations.
- Inventory dan reservation.
- Order lifecycle.
- Payment integration dan webhook.
- Shipping integration.
- Upload signing.
- Persistence.
- Audit logging.
- Scheduled reconciliation dan retention jobs.

### 10.4 Arsitektur backend

Backend menggunakan **modular monolith**. Modul utama:

```text
auth
catalog/products
categories
discounts
inventory
checkout
orders
payments
shipping
uploads
settings
audit
jobs
```

Setiap modul menggunakan clean architecture pragmatis:

```text
module/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── errors/
├── application/
│   ├── use-cases/
│   ├── ports/
│   └── dto/
├── infrastructure/
│   ├── persistence/
│   └── providers/
└── presentation/
    └── controllers/
```

Tidak semua modul harus memiliki semua folder bila tidak dibutuhkan. Tujuan clean architecture adalah menjaga dependency direction, bukan menambah boilerplate.

### 10.5 Dependency direction

```text
Presentation
    ↓
Application
    ↓
Domain

Infrastructure -> implements ports required by Application/Domain
```

Domain tidak boleh bergantung pada NestJS, Supabase, Midtrans, Cloudinary, atau provider eksternal.

### 10.6 API boundary

Host konseptual:

```text
blissfy.co        -> Store Frontend
admin.blissfy.co  -> Admin Frontend
api.blissfy.co    -> Backend API
```

Base API:

```text
/api/v1
```

atau jika host khusus API digunakan:

```text
https://api.blissfy.co/v1
```

### 10.7 Shared packages

Shared package hanya menyimpan hal yang aman digunakan lintas aplikasi:

- API contract.
- Shared TypeScript types.
- Validation schema yang benar-benar identik.
- Config non-secret.
- ESLint/TypeScript config.

Shared package **tidak** menyimpan:

- Database credentials.
- Repository implementation.
- Supabase service-role client.
- Midtrans server key.
- Cloudinary API secret.
- Shipping API secret.

### 10.8 Database principle

Store dan Admin tidak melakukan query langsung terhadap tabel bisnis Supabase.

```text
Store ─┐
       ├──> Backend API ───> Supabase PostgreSQL
Admin ─┘
```

Backend mengatur transaction boundary untuk operasi kritis seperti order, reservation, payment transition, dan inventory movement.

### 10.9 Upload gambar

Alur signed upload Cloudinary dipertahankan:

1. Admin meminta upload signature ke backend.
2. Backend memvalidasi admin.
3. Browser mengunggah langsung ke Cloudinary.
4. Browser mengirim metadata ke backend.
5. Backend memverifikasi metadata dan menyimpan `product_images`.
6. Penghapusan gambar menghapus metadata dan asset bila aman dilakukan.

### 10.10 Deployment principle

- Store, Admin, dan API dapat di-deploy independen.
- Ketiganya tetap berasal dari satu repository.
- Environment variable dipisahkan per aplikasi.
- Secret hanya diberikan kepada aplikasi yang membutuhkannya.
- Perubahan Store tidak harus memaksa deployment Admin/API jika tidak terdampak.
- CI melakukan lint, typecheck, test, dan build per workspace yang terdampak.

---

## 11. Model Data Tingkat Tinggi

| Entitas | Tujuan |
| --- | --- |
| `admin_users` | Mapping/admin profile dan authorization data. |
| `categories` | Mengelompokkan produk. |
| `products` | Identitas, deskripsi, slug, status, dan harga dasar. |
| `product_images` | Metadata Cloudinary, urutan, dan primary image. |
| `product_variants` | Warna, ukuran, SKU, berat, dan stok. |
| `discounts` | Jenis, nilai, periode diskon. |
| `orders` | Ringkasan order, snapshot penerima, total, dan fulfillment status. |
| `order_items` | Snapshot produk/varian/harga/diskon pada transaksi. |
| `payments` | Referensi gateway, status, total, expiry. |
| `payment_events` | Event webhook untuk audit dan idempotency. |
| `shipments` | Kurir, layanan, tarif, estimasi, resi. |
| `stock_reservations` | Stok yang ditahan dan expiry. |
| `inventory_movements` | Ledger perubahan stok. |
| `store_settings` | Alamat asal, berat kemasan, konfigurasi toko. |
| `audit_logs` | Tindakan sensitif admin/sistem. |
| `idempotency_keys` | Menjaga operasi kritis tidak diproses ganda. |

Data penerima disimpan sebagai snapshot pada order karena pelanggan tidak memiliki akun.

---

## 12. Endpoint/API Tingkat Tinggi

### 12.1 Public Store API

```text
GET    /v1/products
GET    /v1/products/:slug
GET    /v1/categories
POST   /v1/shipping/rates
POST   /v1/checkout/validate
POST   /v1/orders
GET    /v1/orders/track/:accessToken
POST   /v1/orders/:accessToken/retry-payment
```

### 12.2 Payment/Webhook API

```text
POST   /v1/webhooks/midtrans
```

Webhook endpoint tidak menggunakan admin auth, tetapi wajib provider verification.

### 12.3 Admin API

```text
GET    /v1/admin/me
GET    /v1/admin/products
POST   /v1/admin/products
GET    /v1/admin/products/:id
PATCH  /v1/admin/products/:id
POST   /v1/admin/uploads/sign
POST   /v1/admin/products/:id/images
PATCH  /v1/admin/products/:id/images/:imageId
DELETE /v1/admin/products/:id/images/:imageId
GET    /v1/admin/orders
GET    /v1/admin/orders/:id
PATCH  /v1/admin/orders/:id/status
PATCH  /v1/admin/orders/:id/shipment
PATCH  /v1/admin/inventory/:variantId
GET    /v1/admin/dashboard/summary
```

Semua admin endpoint membutuhkan token/session admin valid.

---

## 13. Kebutuhan Nonfungsional

### 13.1 Keamanan

- HTTPS untuk seluruh trafik produksi.
- Secret hanya ada di Backend API atau service yang memerlukannya.
- Store/Admin tidak menerima service-role database key.
- Admin token diverifikasi backend.
- Authorization tidak hanya bergantung pada UI.
- Input divalidasi server-side.
- Query database parameterized.
- Webhook verified dan idempotent.
- Rate limiting untuk login, checkout, upload signature, dan endpoint sensitif.
- CORS dibatasi pada origin Store/Admin yang sah.
- Order tracking memakai token acak berentropi tinggi.
- Sensitive data tidak ditulis lengkap di log.
- Dependency audit sebelum produksi.

### 13.2 Maintainability

- Business logic tidak berada di React component.
- Controller tipis; use case menangani orchestration bisnis.
- Infrastructure provider berada di adapter khusus.
- Module boundary terdokumentasi.
- Shared package dijaga minimal.
- API contract terdokumentasi melalui OpenAPI.
- Database migration menjadi source of truth perubahan schema.
- Technical decision penting dicatat sebagai Architecture Decision Record bila diperlukan.

### 13.3 Performa

- Store dioptimalkan untuk Core Web Vitals.
- Gambar adaptive, compressed, lazy-loaded.
- Pagination untuk daftar besar.
- API query menghindari N+1.
- Index database untuk query kritis.
- Shipping rate dapat memakai cache berumur pendek bila aman.
- Upload file langsung ke Cloudinary.

### 13.4 Reliabilitas

- Pembuatan order dan reservation atomik.
- Payment event idempotent.
- Inventory mutation menggunakan transaction/locking yang tepat.
- Scheduled reconciliation untuk payment state.
- Scheduled cleanup untuk expired reservation.
- Error provider tidak membuat data order inkonsisten.
- Backup database sesuai kemampuan provider.

### 13.5 Observability

- Structured logging.
- Request/correlation ID.
- Error log tanpa secret.
- Audit log untuk perubahan sensitif.
- Health endpoint untuk Backend API.
- Metrics minimum untuk order/payment/provider failure bila dibutuhkan.

### 13.6 SEO

- Product page memiliki title, description, canonical, Open Graph, dan slug baik.
- Store dapat diindeks.
- Admin tidak diindeks.
- Checkout/payment/tracking tidak diindeks.
- Sitemap dan robots.txt tersedia.

### 13.7 Aksesibilitas

- Keyboard accessible.
- Label input jelas.
- Alt text gambar.
- Kontras memadai.
- Status tidak hanya berdasarkan warna.
- Error dapat dibaca assistive technology.

### 13.8 Privasi

- Kebijakan privasi tersedia.
- Data pelanggan hanya untuk transaksi/pengiriman/komunikasi.
- Data pribadi disimpan 2 bulan setelah `DELIVERED` atau `CANCELLED`.
- Setelah itu data dihapus/dianonimkan melalui scheduled job.
- Data transaksi nonpersonal dapat dipertahankan.

---

## 14. Analitik dan Event

```text
view_product
select_variant
add_to_cart
view_cart
begin_checkout
shipping_rate_loaded
shipping_service_selected
order_created
payment_qr_displayed
payment_success
payment_expired
order_status_viewed
admin_product_created
admin_inventory_adjusted
admin_image_uploaded
admin_image_deleted
```

KPI awal:

- Pengunjung katalog.
- Product detail -> add-to-cart.
- Add-to-cart -> checkout.
- Checkout -> order dibuat.
- Order -> payment success.
- Payment expiry rate.
- Average order value.
- Produk/varian terlaris.
- Provider error rate.

---

## 15. Acceptance Criteria Alur Kritis

### AC-01: Checkout tanpa akun

**Given** cart valid **When** pelanggan mengisi data dan memilih layanan **Then** order dapat dibuat tanpa akun.

### AC-02: Backend source of truth

**Given** nilai harga di browser dimanipulasi **When** request order dikirim **Then** backend menghitung ulang seluruh nilai dan mengabaikan nilai final dari browser.

### AC-03: Ongkir otomatis

**Given** alamat dan berat valid **When** tarif diminta **Then** backend mengambil layanan dari provider tanpa menebak biaya.

### AC-04: Reservasi stok

**Given** stok terakhir tersedia **When** order aktif dibuat **Then** stok ditahan secara atomik agar tidak oversold.

### AC-05: Pembayaran berhasil

**Given** transaksi aktif **When** webhook valid diterima **Then** payment menjadi `PAID`, order menjadi `PROCESSING`, dan stok tidak diproses ganda.

### AC-06: Pembayaran kedaluwarsa

**Given** transaksi tidak dibayar **When** expiry tercapai **Then** payment menjadi `EXPIRED` dan reservation dilepas.

### AC-07: Webhook palsu

**Given** signature/nominal tidak valid **When** webhook diterima **Then** backend menolak tanpa mengubah state.

### AC-08: Tracking tanpa login

**Given** access token valid **When** halaman tracking dibuka **Then** status yang relevan tampil tanpa login.

### AC-09: Proteksi data order

**Given** hanya nomor order atau token salah **When** akses dicoba **Then** data pribadi tidak ditampilkan.

### AC-10: Pemrosesan admin

**Given** order `PAID` **When** admin menandai `SHIPPED` dan memasukkan resi **Then** tracking pelanggan menampilkan status dan resi.

### AC-11: Ready stock only

**Given** stok nol **When** pelanggan mencoba checkout **Then** backend menolak dan tidak membuat reservation.

### AC-12: Retensi data

**Given** order `DELIVERED/CANCELLED` lebih dari 2 bulan **When** retention job dijalankan **Then** PII dihapus/dianonimkan tanpa merusak laporan nonpersonal.

### AC-13: Upload gambar

**Given** admin valid **When** file valid diunggah **Then** signed upload digunakan dan metadata disimpan lewat backend.

### AC-14: Admin API authorization

**Given** request tanpa credential valid **When** endpoint `/v1/admin/**` dipanggil **Then** backend mengembalikan unauthorized/forbidden dan tidak mengubah data.

### AC-15: Tidak ada direct database mutation dari frontend

**Given** Store/Admin berjalan **When** operasi bisnis dilakukan **Then** operasi tersebut melalui Backend API dan bukan query/mutation tabel bisnis langsung.

### AC-16: Idempotent order creation

**Given** request order dengan idempotency key yang sama terkirim berulang **When** backend memprosesnya **Then** hanya satu order efektif dibuat.

---

## 16. Strategi Pengujian

### 16.1 Unit test

- Domain rule diskon.
- Price calculation.
- Fulfillment transition.
- Payment transition.
- Inventory reservation rule.
- Checkout validation.
- Package weight.
- Webhook signature verification.
- Cloudinary upload signature service.
- Use case utama backend.

### 16.2 Integration test

- Repository -> database.
- Order + reservation transaction.
- Inventory locking.
- Shipping provider adapter.
- Midtrans adapter sandbox.
- Webhook success/expired/duplicate.
- Supabase Auth token verification.
- Cloudinary signed upload flow.
- Retention/reconciliation job.

### 16.3 API E2E test

- Public product API.
- Guest order creation.
- Invalid checkout.
- Duplicate idempotency key.
- Payment webhook.
- Admin authorization.
- Inventory adjustment.
- Order fulfillment transition.

### 16.4 Frontend E2E test

- Browse -> cart -> checkout -> payment.
- Mobile checkout.
- Payment expired/retry.
- Out-of-stock state.
- Shipping provider failure.
- Admin product CRUD.
- Admin image upload/reorder/delete.
- Admin order processing.
- Customer tracking.

### 16.5 Production limited test

- Sandbox dahulu.
- Transaksi produksi nominal kecil.
- Verifikasi payment, order, stok, shipment, dan dashboard konsisten.
- Verifikasi secret tidak masuk frontend bundle/repository.

---

## 17. Tahapan Implementasi

### Fase 0 - Restrukturisasi arsitektur

- Ubah repository menjadi pnpm/Turborepo monorepo.
- Buat `apps/store`, `apps/admin`, `apps/api`.
- Pisahkan UI dari business logic yang sudah ada.
- Buat shared `contracts`, `types`, dan config.
- Pastikan Store/Admin tidak melakukan direct DB access.

### Fase 1 - Backend foundation

- Inisialisasi NestJS.
- Setup config/env.
- Setup database connection/repository layer.
- Setup Supabase Auth verification.
- Global validation/error format.
- Logging/request ID.
- API versioning.
- OpenAPI/Swagger.
- Health endpoint.

### Fase 2 - Catalog & Admin

- Products.
- Categories.
- Variants.
- Discounts.
- Inventory.
- Admin product CRUD.
- Admin inventory adjustment.
- Cloudinary signed upload.

### Fase 3 - Store experience

- Homepage.
- Catalog.
- Product detail.
- Search/filter.
- Cart.
- Guest checkout form.

### Fase 4 - Shipping

- Store settings asal.
- Shipping provider adapter.
- Rate calculation.
- Snapshot shipment quote.

### Fase 5 - Order, payment, and stock

- Orders/order items.
- Stock reservation.
- QRIS transaction.
- Webhook/idempotency.
- Expiry/retry.
- Reconciliation.

### Fase 6 - Operations

- Admin order list/detail.
- Fulfillment transition.
- Resi.
- Customer tracking.
- Dashboard summary.
- Audit log.

### Fase 7 - Production readiness

- Security review.
- Rate limiting.
- SEO/accessibility.
- Automated tests.
- Retention job.
- CI/CD monorepo.
- Deployment Store/Admin/API.
- Sandbox dan limited production transaction.

---

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Monorepo menjadi terlalu kompleks | Developer lambat | Shared package minimal, naming konsisten, dokumentasi boundary. |
| Clean architecture menjadi over-engineered | Banyak boilerplate | Gunakan clean architecture pragmatis; folder hanya jika dibutuhkan. |
| Backend API menjadi single point of failure | Store/Admin terganggu | Health check, logging, retry untuk provider, deployment stabil. |
| Webhook terlambat/gagal | Payment belum sinkron | Event log, reconciliation, scheduled recovery. |
| Webhook duplikat | State/stok ganda | Unique event/idempotency + transaction. |
| Dua pembeli berebut stok terakhir | Overselling | Reservation + transaction/locking. |
| Shipping provider gagal | Checkout terhambat | Retry dan fail-closed; jangan menebak tarif. |
| Provider payment berubah | Integrasi terdampak | Adapter/port di infrastructure layer. |
| Store/Admin kontrak API berbeda | Runtime error | Shared contract + OpenAPI + typecheck. |
| Secret bocor ke frontend | Security incident | Secret hanya di API; env per app; build audit. |
| Direct DB access kembali muncul di frontend | Boundary rusak | Code review, lint/convention, dokumentasi arsitektur. |
| Upload file gagal | Admin terganggu | Direct upload + retry per file. |

---

## 19. Dependensi Eksternal

- Midtrans merchant + QRIS credential.
- Shipping provider API.
- Supabase PostgreSQL + Auth.
- Cloudinary.
- Hosting/deployment untuk Store, Admin, dan Backend API.
- Domain produksi.
- Email provider.
- Data produk, gambar, harga, berat, ukuran, dan stok asli.
- Kebijakan retur/refund/pengiriman.

---

## 20. Keputusan yang Sudah Final

- Single store; bukan marketplace.
- Nama merek Blissfy.co.
- Font Poppins.
- Wordmark teks `Blissfy.co`.
- Alamat asal di Ulujami, Pemalang.
- Kurir MVP J&T dan JNE.
- Database Supabase PostgreSQL.
- Email pelanggan wajib.
- Data pribadi disimpan 2 bulan setelah selesai/batal.
- Ready stock only.
- Guest checkout tanpa akun.
- Satu admin.
- Diskon produk.
- Pengiriman seluruh Indonesia.
- Ongkir otomatis.
- Payment MVP QRIS Midtrans.
- Payment expiry 10 menit.
- Stock reservation selama payment pending.
- Cloudinary signed upload; tanpa URL manual.
- **Satu monorepo.**
- **Store Frontend dan Admin Frontend adalah aplikasi terpisah.**
- **Backend API adalah aplikasi NestJS terpisah.**
- **Frontend tidak mengakses tabel bisnis langsung.**
- **Backend menjadi source of truth untuk business logic dan mutation.**
- **Backend menggunakan modular monolith, bukan microservices.**
- **Backend menerapkan clean architecture pragmatis.**
- **API menggunakan REST dan didokumentasikan OpenAPI.**
- **Store, Admin, dan API dapat di-deploy independen.**

---

## 21. Keputusan Terbuka Sebelum Produksi

| Pertanyaan | Dampak |
| --- | --- |
| Apakah notifikasi WhatsApp masuk MVP? | Biaya dan integrasi komunikasi. |
| Berapa berat kemasan default? | Akurasi ongkir. |
| Bagaimana kebijakan retur dan batas waktunya? | Operasional dan halaman kebijakan. |
| Bagaimana prosedur refund? | Order bermasalah. |
| Berapa maksimum gambar per produk/ukuran file? | Cloudinary dan UX. |
| Provider hosting final untuk Backend API? | Runtime, scaling, biaya, dan observability. |
| Apakah API memakai satu domain `api.blissfy.co` sejak awal? | CORS, DNS, dan deployment. |

---

## 22. Definition of Done MVP

MVP dianggap selesai apabila:

- Seluruh acceptance criteria kritis lulus.
- Pelanggan dapat membeli tanpa akun di mobile dan desktop.
- Store dan Admin berjalan sebagai aplikasi terpisah dalam satu monorepo.
- Backend NestJS berjalan sebagai API terpisah.
- Store/Admin tidak melakukan direct mutation ke database bisnis.
- Perhitungan harga, diskon, ongkir, total, stok, dan status tervalidasi backend.
- QRIS sandbox dan produksi terbatas telah diuji.
- Webhook valid, invalid, duplicate, dan expired telah diuji.
- Order creation dan stock reservation aman dari duplicate/overselling utama.
- Admin dapat mengelola produk, gambar, inventory, order, dan resi melalui API.
- Pelanggan dapat melacak order melalui token rahasia.
- Secret tidak terdapat di repository atau frontend bundle.
- Migration Supabase terdokumentasi.
- OpenAPI backend tersedia.
- Logging dan error handling backend tersedia.
- Unit/integration/API E2E untuk alur kritis tersedia.
- Halaman privasi, terms, shipping, return, dan contact tersedia.
- Retention process 2 bulan telah diuji.
- Store, Admin, dan API dapat di-deploy secara independen.
- Dokumentasi setup, environment variables, architecture, API, dan deployment tersedia.

---

## Persetujuan Dokumen

PRD v1.4 menjadi acuan produk utama Blissfy.co untuk UI/UX, technical design, backend architecture, database design, backlog, testing, dan implementasi. Perubahan yang memengaruhi payment, inventory, order lifecycle, data pelanggan, atau boundary Store/Admin/API harus dicatat sebagai revisi PRD atau Architecture Decision Record.
