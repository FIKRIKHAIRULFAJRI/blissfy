# Product Requirements Document (PRD)

## Blissfy.co Fashion E-Commerce Web Application

| Informasi | Detail |
|---|---|
| Status dokumen | Draft v1.2 - Operational Decisions Finalized |
| Tanggal | 12 Agustus 2026 |
| Nama produk/merek | Blissfy.co |
| Jenis produk | Single-store fashion e-commerce |
| Platform | Web responsif |
| Target rilis | MVP / portfolio-ready / production-ready |
| Deployment awal | Vercel |
| Pemilik bisnis | Satu pemilik sekaligus admin |

---

## 1. Ringkasan Produk

Blissfy.co adalah web app e-commerce yang menjual produk fashion milik satu bisnis. Pelanggan dapat melihat katalog, memilih ukuran dan warna, memasukkan produk ke keranjang, menghitung ongkos kirim ke seluruh Indonesia, dan menyelesaikan pembayaran QRIS tanpa membuat akun atau login.

Sistem menggunakan QRIS dinamis dan webhook payment gateway agar pembayaran dapat dikonfirmasi secara otomatis. Admin tidak perlu memeriksa mutasi rekening secara manual. Setelah pembayaran berhasil, sistem memperbarui status pembayaran dan pesanan serta menginformasikan pesanan tersebut kepada admin.

Versi pertama Blissfy.co dibangun sebagai proyek portofolio yang tetap memenuhi kebutuhan dasar bisnis sungguhan. Arsitektur awal dibuat sederhana agar dapat di-deploy di Vercel, tetapi komponen penting seperti database, penyimpanan gambar, layanan pembayaran, dan layanan pengiriman dipisahkan agar sistem dapat dikembangkan tanpa membangun ulang seluruh aplikasi.

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

## 2. Latar Belakang dan Masalah

Calon pelanggan toko fashion sering mengalami hambatan ketika diwajibkan membuat akun sebelum membeli. Proses registrasi memperpanjang checkout dan dapat meningkatkan kemungkinan pelanggan membatalkan pembelian.

Di sisi operasional, konfirmasi pembayaran melalui pemeriksaan mutasi secara manual memiliki beberapa masalah:

- Admin harus mencocokkan nominal dan identitas pembeli secara manual.
- Pembayaran dapat terlambat diproses.
- Risiko kesalahan pencocokan pembayaran meningkat.
- Stok dapat tidak akurat ketika beberapa pelanggan membeli varian terakhir secara bersamaan.
- Ongkos kirim sulit dihitung secara konsisten tanpa integrasi layanan pengiriman.

Produk ini menyelesaikan masalah tersebut melalui guest checkout, perhitungan ongkir otomatis, reservasi stok, QRIS dinamis, serta konfirmasi pembayaran server-to-server.

## 3. Tujuan Produk

### 3.1 Tujuan utama

1. Memungkinkan pelanggan membeli produk tanpa registrasi dan login.
2. Memungkinkan pembayaran menggunakan QRIS dinamis dengan batas waktu 10 menit.
3. Memperbarui status pembayaran secara otomatis melalui webhook.
4. Menghitung ongkos kirim secara otomatis untuk tujuan di seluruh Indonesia.
5. Mengelola produk fashion berdasarkan variasi ukuran, warna, SKU, berat, dan stok.
6. Mendukung harga normal serta diskon produk berbasis persentase atau nominal.
7. Memberikan satu dashboard yang memungkinkan admin mengelola katalog, stok, pesanan, pembayaran, dan pengiriman.
8. Menghasilkan aplikasi yang layak ditampilkan sebagai portofolio dan cukup aman untuk transaksi bisnis sungguhan.

### 3.2 Indikator keberhasilan MVP

- Pelanggan dapat menyelesaikan pesanan tanpa akun dari katalog hingga pembayaran.
- Ongkir yang ditampilkan berasal dari API pengiriman, bukan nilai statis.
- Pembayaran berhasil mengubah status pesanan tanpa tindakan manual admin.
- Transaksi yang tidak dibayar dalam 10 menit menjadi kedaluwarsa.
- Reservasi stok dilepas ketika pembayaran kedaluwarsa.
- Admin dapat memproses pesanan dan menambahkan nomor resi.
- Pelanggan dapat melihat status pesanan tanpa login melalui tautan rahasia.
- Seluruh alur utama berjalan baik pada perangkat mobile dan desktop.

## 4. Ruang Lingkup

### 4.1 Termasuk dalam MVP

- Toko menjual produk milik sendiri (single store).
- Katalog dan detail produk.
- Kategori produk.
- Pencarian dan filter produk.
- Varian ukuran dan warna.
- SKU dan stok per varian.
- Harga normal dan diskon produk.
- Keranjang belanja tanpa akun.
- Guest checkout.
- Alamat pengiriman seluruh Indonesia.
- Perhitungan ongkir otomatis berdasarkan lokasi, berat, dan layanan kurir.
- QRIS dinamis.
- Masa pembayaran 10 menit.
- Webhook pembayaran otomatis.
- Reservasi stok selama menunggu pembayaran.
- Pelacakan status pesanan tanpa login.
- Dashboard untuk satu admin.
- Pengelolaan nomor resi secara manual oleh admin.
- Halaman kebijakan dasar toko.
- Deployment awal di Vercel.

### 4.2 Tidak termasuk dalam MVP

- Marketplace atau multi-vendor.
- Akun dan login pelanggan.
- Loyalty point atau membership.
- Wishlist lintas perangkat.
- Voucher kompleks dan program referral.
- Pembayaran kartu, virtual account, COD, atau paylater.
- Chat langsung di dalam aplikasi.
- Multi-admin dan role-based access control.
- Pembuatan label pengiriman/AWB otomatis.
- Refund otomatis.
- Retur mandiri melalui dashboard pelanggan.
- Integrasi marketplace eksternal.
- Rekomendasi produk berbasis AI.

Fitur di luar MVP dapat ditambahkan setelah validasi kebutuhan bisnis dan volume transaksi.

## 5. Pengguna dan Persona

### 5.1 Pelanggan

Pelanggan adalah pengguna yang ingin membeli produk fashion dengan cepat melalui ponsel atau desktop. Pelanggan tidak ingin membuat akun dan mengharapkan informasi harga, diskon, stok, ukuran, ongkir, pembayaran, dan status pesanan yang jelas.

**Kebutuhan pelanggan:**

- Menemukan produk dengan mudah.
- Melihat foto dan informasi produk yang akurat.
- Memastikan ukuran dan warna tersedia.
- Mengetahui harga akhir sebelum membayar.
- Mendapatkan pilihan layanan pengiriman dan ongkir.
- Membayar menggunakan aplikasi yang mendukung QRIS.
- Mendapatkan bukti serta status pesanan tanpa login.

### 5.2 Admin

Admin adalah pemilik atau pengelola tunggal toko.

**Kebutuhan admin:**

- Mengelola produk, varian, gambar, harga, diskon, berat, dan stok.
- Mengetahui pesanan yang sudah dibayar tanpa memeriksa mutasi.
- Melihat detail penerima dan layanan pengiriman.
- Mengubah tahapan pemrosesan pesanan.
- Memasukkan nomor resi.
- Melihat transaksi bermasalah atau kedaluwarsa.
- Melihat ringkasan penjualan dasar.

## 6. User Journey Utama

### 6.1 Journey pembelian berhasil

1. Pelanggan membuka beranda atau katalog.
2. Pelanggan membuka detail produk.
3. Pelanggan memilih warna, ukuran, dan jumlah.
4. Sistem memvalidasi ketersediaan varian.
5. Pelanggan memasukkan produk ke keranjang.
6. Pelanggan membuka checkout tanpa login.
7. Pelanggan mengisi identitas dan alamat penerima.
8. Sistem mengambil pilihan layanan dan tarif dari API pengiriman.
9. Pelanggan memilih kurir dan layanan.
10. Backend menghitung kembali produk, diskon, berat, ongkir, dan total.
11. Sistem membuat pesanan dan menahan stok selama 10 menit.
12. Payment gateway menghasilkan QRIS dinamis.
13. Pelanggan memindai QRIS dan membayar.
14. Payment gateway mengirim webhook ke backend.
15. Backend memverifikasi notifikasi dan mengubah pembayaran menjadi `PAID`.
16. Status pemenuhan pesanan berubah menjadi `PROCESSING`.
17. Admin menyiapkan dan mengirim pesanan.
18. Admin memasukkan kurir dan nomor resi.
19. Pelanggan memeriksa status melalui tautan rahasia.

### 6.2 Journey pembayaran kedaluwarsa

1. Sistem membuat QRIS dan menyimpan `expires_at` selama 10 menit.
2. Pelanggan tidak membayar hingga batas waktu berakhir.
3. Gateway mengirim status kedaluwarsa atau backend mendeteksinya melalui rekonsiliasi.
4. Pembayaran berubah menjadi `EXPIRED`.
5. Pesanan tetap tercatat tetapi tidak dapat diproses.
6. Reservasi stok dilepas.
7. Pelanggan dapat memilih **Buat Pembayaran Baru**.
8. Sistem memeriksa ulang harga, diskon, ongkir, dan stok sebelum membuat transaksi baru.

## 7. Kebutuhan Fungsional

### 7.1 Katalog produk

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PROD-01 | Sistem menampilkan daftar produk aktif. | Must |
| FR-PROD-02 | Sistem menampilkan nama, foto utama, harga normal, harga diskon, dan status stok. | Must |
| FR-PROD-03 | Pelanggan dapat membuka detail produk melalui URL unik. | Must |
| FR-PROD-04 | Detail produk menampilkan galeri foto, deskripsi, ukuran, warna, harga, dan panduan ukuran. | Must |
| FR-PROD-05 | Pelanggan dapat mencari produk berdasarkan nama. | Must |
| FR-PROD-06 | Pelanggan dapat memfilter produk berdasarkan kategori, ukuran, warna, rentang harga, dan ketersediaan. | Should |
| FR-PROD-07 | Sistem tidak mengizinkan pembelian varian yang stoknya tidak tersedia. | Must |

### 7.2 Keranjang belanja

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-CART-01 | Pelanggan dapat menambah varian produk ke keranjang. | Must |
| FR-CART-02 | Pelanggan dapat mengubah jumlah atau menghapus produk. | Must |
| FR-CART-03 | Keranjang disimpan di browser agar tidak langsung hilang saat halaman dimuat ulang. | Must |
| FR-CART-04 | Sistem menampilkan subtotal dan penghematan dari diskon. | Must |
| FR-CART-05 | Backend memvalidasi ulang harga dan stok saat checkout. | Must |
| FR-CART-06 | Perubahan harga atau stok ditampilkan kepada pelanggan sebelum pemesanan dilanjutkan. | Must |

### 7.3 Guest checkout

Pelanggan tidak perlu membuat akun. Data berikut wajib dikumpulkan:

- Nama penerima.
- Nomor WhatsApp aktif.
- Email aktif.
- Provinsi.
- Kota/kabupaten.
- Kecamatan.
- Kode pos.
- Alamat lengkap.
- Pilihan kurir dan layanan.

Data berikut bersifat opsional:

- Kelurahan/desa apabila tidak diwajibkan API.
- Patokan atau catatan alamat.
- Catatan pesanan.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-CHK-01 | Checkout dapat dilakukan tanpa autentikasi pelanggan. | Must |
| FR-CHK-02 | Sistem memvalidasi format nomor WhatsApp dan data alamat wajib. | Must |
| FR-CHK-03 | Pelanggan harus menyetujui syarat pembelian dan kebijakan privasi. | Must |
| FR-CHK-04 | Sistem menampilkan ringkasan final sebelum membuat pesanan. | Must |
| FR-CHK-05 | Backend menjadi sumber kebenaran untuk harga, diskon, ongkir, dan total. | Must |
| FR-CHK-06 | Klik berulang pada tombol pembuatan pesanan tidak boleh membuat pesanan ganda. | Must |
| FR-CHK-07 | Email wajib diisi dan divalidasi sebelum pelanggan dapat membuat pesanan. | Must |

### 7.4 Harga dan diskon

MVP mendukung diskon persentase dan diskon nominal pada tingkat produk.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-DISC-01 | Admin dapat menentukan harga normal produk. | Must |
| FR-DISC-02 | Admin dapat memilih diskon persentase atau nominal. | Must |
| FR-DISC-03 | Admin dapat menentukan waktu mulai dan berakhir diskon. | Must |
| FR-DISC-04 | Sistem hanya menerapkan diskon yang aktif pada waktu transaksi. | Must |
| FR-DISC-05 | Harga diskon tidak boleh nol atau negatif akibat konfigurasi yang salah. | Must |
| FR-DISC-06 | Harga normal, nilai diskon, dan harga jual disalin ke item pesanan. | Must |
| FR-DISC-07 | Perubahan harga setelah pesanan dibuat tidak mengubah nilai pesanan lama. | Must |

Rumus awal:

```text
Subtotal kotor = jumlah x harga normal
Diskon produk  = perhitungan diskon aktif
Subtotal bersih = subtotal kotor - diskon produk
Total pembayaran = subtotal bersih + ongkos kirim
```

MDR atau biaya layanan pembayaran merupakan biaya operasional merchant dan tidak ditambahkan otomatis kepada pelanggan pada MVP.

### 7.5 Pengiriman dan ongkos kirim

Perhitungan ongkir dilakukan melalui RajaOngkir/Komerce menggunakan layanan J&T dan JNE. API key hanya disimpan pada server.

Alamat asal pengiriman MVP:

```text
Jl. Mahoni, Temu Ireng, Sukorejo,
Kec. Ulujami, Kabupaten Pemalang,
Jawa Tengah 52371
```

Input perhitungan minimum:

- Alamat asal/gudang.
- Lokasi tujuan pelanggan.
- Berat total paket.
- Dimensi paket jika diperlukan.
- Kurir dan jenis layanan.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-SHIP-01 | Sistem menggunakan alamat asal Blissfy.co di Kecamatan Ulujami, Kabupaten Pemalang. | Must |
| FR-SHIP-02 | Setiap produk memiliki berat dalam gram. | Must |
| FR-SHIP-03 | Sistem menghitung total berat produk dan tambahan berat kemasan. | Must |
| FR-SHIP-04 | Sistem mengambil tarif pengiriman secara real-time/semi-real-time dari API. | Must |
| FR-SHIP-05 | Pelanggan dapat memilih layanan J&T atau JNE yang dikembalikan API. | Must |
| FR-SHIP-06 | Sistem menampilkan biaya serta estimasi waktu dari respons penyedia. | Must |
| FR-SHIP-07 | Tarif terpilih disalin ke pesanan agar tidak berubah setelah checkout. | Must |
| FR-SHIP-08 | Jika API ongkir gagal, sistem tidak boleh menebak tarif atau membuat pesanan dengan ongkir nol. | Must |
| FR-SHIP-09 | Admin dapat memasukkan nomor resi setelah pesanan dikirim. | Must |
| FR-SHIP-10 | Integrasi pelacakan resi otomatis dapat ditambahkan setelah MVP. | Could |

Biaya ongkir bukan angka tetap. Nilainya ditentukan oleh API berdasarkan asal, tujuan, berat/dimensi, kurir, dan layanan yang dipilih.

### 7.6 Pembayaran QRIS

Payment gateway awal: Midtrans. Integrasi menggunakan QRIS dinamis dan webhook.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PAY-01 | Backend membuat transaksi gateway untuk setiap pesanan. | Must |
| FR-PAY-02 | Sistem menampilkan QRIS, total, nomor pesanan, dan hitung mundur. | Must |
| FR-PAY-03 | Masa berlaku pembayaran adalah 10 menit. | Must |
| FR-PAY-04 | Waktu kedaluwarsa disimpan di database dan gateway, bukan hanya timer browser. | Must |
| FR-PAY-05 | Sistem menerima perubahan status melalui endpoint webhook HTTPS. | Must |
| FR-PAY-06 | Sistem memverifikasi signature, ID transaksi, dan nominal. | Must |
| FR-PAY-07 | Hanya status pembayaran sah dari server gateway yang dapat menandai pesanan lunas. | Must |
| FR-PAY-08 | Pemrosesan webhook bersifat idempotent. | Must |
| FR-PAY-09 | Sistem menyimpan peristiwa webhook untuk audit tanpa mengekspos data rahasia. | Must |
| FR-PAY-10 | Pelanggan dapat mencoba pembayaran baru setelah transaksi kedaluwarsa. | Must |
| FR-PAY-11 | Sistem menyediakan rekonsiliasi status melalui API gateway sebagai mekanisme cadangan. | Should |

Status pembayaran:

```text
PENDING -> PAID
PENDING -> EXPIRED
PENDING -> FAILED
PAID -> REFUNDED (manual/fase berikutnya)
```

### 7.7 Reservasi dan manajemen stok

Stok dikelola per kombinasi varian, misalnya warna Hitam dan ukuran M.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-STOCK-01 | Setiap varian memiliki SKU unik dan stok. | Must |
| FR-STOCK-02 | Sistem menahan stok saat transaksi pembayaran berhasil dibuat. | Must |
| FR-STOCK-03 | Reservasi berlaku maksimal 10 menit sesuai masa pembayaran. | Must |
| FR-STOCK-04 | Pembayaran berhasil mengubah reservasi menjadi penjualan. | Must |
| FR-STOCK-05 | Pembayaran kedaluwarsa melepaskan reservasi. | Must |
| FR-STOCK-06 | Proses stok menggunakan transaksi database untuk mencegah overselling. | Must |
| FR-STOCK-07 | Webhook ganda tidak boleh mengurangi stok lebih dari sekali. | Must |
| FR-STOCK-08 | Admin dapat melakukan penyesuaian stok dengan catatan alasan. | Should |
| FR-STOCK-09 | Sistem hanya mendukung ready stock dan menolak pre-order atau backorder. | Must |

### 7.8 Pesanan dan pelacakan tanpa akun

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ORD-01 | Sistem membuat nomor pesanan yang mudah dibaca tetapi sulit ditebak secara berurutan. | Must |
| FR-ORD-02 | Sistem membuat token akses rahasia untuk halaman status. | Must |
| FR-ORD-03 | Pelanggan dapat membuka status melalui tautan rahasia tanpa login. | Must |
| FR-ORD-04 | Nomor pesanan saja tidak cukup untuk membuka data pribadi pelanggan. | Must |
| FR-ORD-05 | Halaman menampilkan item, nilai pembayaran, status, kurir, dan resi. | Must |
| FR-ORD-06 | Sistem tidak menampilkan data pribadi lebih banyak daripada yang diperlukan. | Must |

Status pemenuhan pesanan:

```text
WAITING_PAYMENT
PROCESSING
PACKED
SHIPPED
DELIVERED
CANCELLED
```

Status pembayaran dan status pemenuhan harus disimpan terpisah. Pesanan dapat memiliki pembayaran `PAID` dan status pemenuhan `PROCESSING`.

### 7.9 Dashboard admin

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ADM-01 | Admin dapat login dan logout dengan aman menggunakan kredensial dari tabel `admin_users`. | Must |
| FR-ADM-02 | Admin dapat membuat, mengubah, mengarsipkan, dan melihat produk. | Must |
| FR-ADM-03 | Admin dapat mengelola kategori, gambar, varian, SKU, berat, dan stok. | Must |
| FR-ADM-04 | Admin dapat mengatur harga dan periode diskon. | Must |
| FR-ADM-05 | Admin dapat melihat dan memfilter pesanan berdasarkan status. | Must |
| FR-ADM-06 | Admin dapat membuka detail pembayaran dan pengiriman. | Must |
| FR-ADM-07 | Admin dapat mengubah status pemenuhan sesuai transisi yang diizinkan. | Must |
| FR-ADM-08 | Admin dapat memasukkan nomor resi. | Must |
| FR-ADM-09 | Admin dapat melihat ringkasan jumlah pesanan dan nilai penjualan. | Should |
| FR-ADM-10 | Admin dapat melihat alamat asal yang dikonfigurasi dan mengatur berat kemasan. | Must |
| FR-ADM-11 | Sistem mencatat tindakan sensitif admin dalam audit log. | Should |

## 8. Aturan Bisnis

1. Toko hanya menjual produk milik bisnis sendiri.
2. Pelanggan tidak wajib memiliki akun.
3. Satu checkout menghasilkan satu pesanan dan satu transaksi pembayaran aktif.
4. Harga dan diskon selalu dihitung ulang oleh backend.
5. Ongkir harus berasal dari penyedia API yang dikonfigurasi.
6. QRIS berlaku selama 10 menit sejak transaksi berhasil dibuat.
7. Stok ditahan selama masa pembayaran.
8. Pesanan hanya dianggap lunas setelah backend menerima dan memverifikasi status sukses dari gateway.
9. Redirect atau tampilan sukses pada browser bukan bukti pembayaran.
10. Transaksi kedaluwarsa tidak dapat ditandai lunas melalui input admin biasa.
11. Jika pelanggan membuat pembayaran ulang, sistem harus memeriksa kembali harga, diskon, ongkir, dan stok.
12. Admin tidak boleh mengubah nilai historis item pada pesanan yang telah dibayar.
13. Produk yang diarsipkan tetap dapat muncul pada riwayat pesanan lama.
14. Nomor resi hanya dapat ditambahkan pada pesanan yang telah dibayar.
15. Data pribadi hanya digunakan untuk pemrosesan pesanan, komunikasi transaksi, dan pengiriman.
16. Email pelanggan wajib untuk bukti transaksi dan akses informasi pesanan.
17. Kurir yang tersedia pada MVP dibatasi pada J&T dan JNE.
18. Penjualan hanya menggunakan ready stock; pre-order dan backorder tidak tersedia.
19. Data pribadi pelanggan disimpan selama 2 bulan setelah pesanan selesai atau dibatalkan, kemudian dihapus atau dianonimkan secara terjadwal.
20. Data transaksi nonpersonal yang telah dianonimkan dapat dipertahankan untuk laporan bisnis.

## 9. Rancangan Halaman

### 9.1 Halaman pelanggan

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

### 9.2 Halaman admin

```text
/admin/login
/admin
/admin/products
/admin/products/new
/admin/products/[id]
/admin/categories
/admin/orders
/admin/orders/[id]
/admin/inventory
/admin/settings
```

### 9.3 Persyaratan UX utama

- Desain mobile-first dan responsif.
- Tombol tindakan utama terlihat jelas.
- Pemilihan ukuran dan warna wajib sebelum menambah produk.
- Harga normal, diskon, harga akhir, dan ongkir ditampilkan transparan.
- Checkout menggunakan langkah sesedikit mungkin.
- Kesalahan form ditampilkan dekat dengan field terkait.
- Halaman pembayaran menampilkan QRIS, total, instruksi, dan hitung mundur.
- Status berhasil tidak hanya bergantung pada refresh manual.
- Pelanggan tetap dapat membuka kembali tautan pembayaran/status.
- Kondisi loading, kosong, gagal, kedaluwarsa, dan stok habis memiliki tampilan khusus.

## 10. Arsitektur dan Teknologi

### 10.1 Stack awal

| Lapisan | Teknologi yang direncanakan |
|---|---|
| Framework web | Next.js (React) + TypeScript |
| Styling | Tailwind CSS |
| Font utama | Poppins melalui `next/font/google` |
| Komponen UI | shadcn/ui atau komponen internal |
| Form | React Hook Form + Zod |
| Data fetching | TanStack Query bila diperlukan |
| State keranjang | Zustand + localStorage |
| Backend | Next.js Route Handlers / Server Actions sesuai kebutuhan |
| Database | Supabase PostgreSQL |
| Akses database | SQL parameterized query melalui koneksi server-side |
| Penyimpanan gambar | Cloudinary |
| Payment gateway | Midtrans QRIS |
| API pengiriman | RajaOngkir/Komerce untuk layanan J&T dan JNE |
| Deployment | Vercel |
| Email transaksi | Resend atau penyedia setara; email pelanggan wajib |

### 10.2 Prinsip arsitektur Vercel

- Backend berjalan sebagai fungsi serverless; sistem tidak menggunakan proses server yang harus hidup terus-menerus.
- Timer 10 menit disimpan sebagai `expires_at`, bukan `setTimeout` server.
- Secret disimpan sebagai environment variables Vercel.
- Gambar tidak disimpan pada filesystem deployment.
- Database menggunakan koneksi yang sesuai lingkungan serverless atau connection pooling.
- Skema database dan perubahan struktur dikelola melalui SQL migration Supabase.
- Webhook harus merespons cepat; pekerjaan lanjutan yang berat perlu dipisahkan bila skala meningkat.
- Scheduled job/cron dapat digunakan sebagai rekonsiliasi cadangan, bukan sumber utama status pembayaran.

## 11. Model Data Tingkat Tinggi

| Entitas | Tujuan |
|---|---|
| `admin_users` | Menyimpan akun admin tunggal dan password ter-hash. |
| `categories` | Mengelompokkan produk. |
| `products` | Menyimpan identitas, deskripsi, slug, status, dan harga dasar. |
| `product_images` | Menyimpan URL serta urutan gambar. |
| `product_variants` | Menyimpan warna, ukuran, SKU, berat, dan stok. |
| `discounts` | Menyimpan jenis, nilai, serta periode diskon produk. |
| `orders` | Menyimpan ringkasan pesanan, snapshot penerima, nilai, dan status. |
| `order_items` | Menyimpan snapshot produk, varian, jumlah, harga, dan diskon. |
| `payments` | Menyimpan referensi gateway, total, status, dan kedaluwarsa. |
| `payment_events` | Menyimpan event webhook untuk audit dan idempotensi. |
| `shipments` | Menyimpan kurir, layanan, tarif, estimasi, serta nomor resi. |
| `stock_reservations` | Menyimpan stok yang ditahan dan masa berlakunya. |
| `inventory_movements` | Mencatat perubahan stok. |
| `store_settings` | Menyimpan alamat asal, berat kemasan, dan konfigurasi toko. |
| `audit_logs` | Mencatat tindakan sensitif admin/sistem. |

Data penerima dapat disimpan sebagai snapshot di dalam pesanan karena pelanggan tidak memiliki akun. Dengan demikian, pesanan historis tidak bergantung pada profil pelanggan yang dapat berubah.

## 12. Endpoint/API Tingkat Tinggi

Endpoint final dapat berubah saat technical design, tetapi kebutuhan utamanya meliputi:

```text
GET    /api/products
GET    /api/products/[slug]
POST   /api/shipping/rates
POST   /api/checkout/validate
POST   /api/orders
GET    /api/orders/[accessToken]
POST   /api/orders/[accessToken]/retry-payment
POST   /api/webhooks/midtrans

POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/orders
PATCH  /api/admin/orders/[id]
POST   /api/admin/products
PATCH  /api/admin/products/[id]
PATCH  /api/admin/inventory/[variantId]
```

Semua endpoint admin membutuhkan autentikasi. Endpoint webhook tidak menggunakan autentikasi admin, tetapi wajib memverifikasi signature provider.

## 13. Kebutuhan Nonfungsional

### 13.1 Keamanan

- Seluruh trafik produksi menggunakan HTTPS.
- Secret payment, database, Cloudinary, dan ongkir tidak dikirim ke frontend.
- Password admin disimpan menggunakan hashing yang kuat.
- Session admin menggunakan cookie `HttpOnly`, `Secure`, dan `SameSite` yang sesuai.
- Endpoint login dan checkout menggunakan rate limiting.
- Input divalidasi di server.
- Query database menggunakan parameterized query.
- Webhook diverifikasi dan diproses secara idempotent.
- Akses pesanan pelanggan menggunakan token acak berentropi tinggi.
- Data sensitif tidak ditulis lengkap dalam log.
- Dependensi diperbarui dan diaudit sebelum rilis produksi.

### 13.2 Performa

- Halaman katalog dan detail produk dioptimalkan untuk Core Web Vitals.
- Gambar menggunakan ukuran adaptif, kompresi, lazy loading, dan format modern.
- Daftar produk menggunakan pagination atau infinite loading yang terkontrol.
- Respons interaksi utama ditargetkan terasa kurang dari 2 detik pada koneksi wajar, di luar latensi pihak ketiga.
- Pemanggilan tarif pengiriman menggunakan debounce/cache bila aman.

### 13.3 Reliabilitas

- Kegagalan gateway atau API pengiriman memberikan pesan yang dapat dipahami dan opsi mencoba kembali.
- Pembuatan order dan reservasi stok dilakukan secara atomik.
- Webhook ganda dan request checkout ganda tidak menghasilkan dampak ganda.
- Database memiliki backup yang terjadwal sesuai kemampuan provider.
- Status pembayaran dapat direkonsiliasi terhadap gateway.

### 13.4 SEO

- Setiap halaman produk mempunyai title, description, canonical URL, Open Graph, dan slug yang baik.
- Produk aktif dapat diindeks mesin pencari.
- Halaman admin, checkout, pembayaran, dan status pesanan tidak diindeks.
- Sitemap dan robots.txt tersedia.
- Structured data Product dapat ditambahkan setelah data harga dan stok stabil.

### 13.5 Aksesibilitas

- Navigasi dan formulir dapat digunakan dengan keyboard.
- Gambar produk memiliki alt text.
- Input memiliki label yang jelas.
- Kontras warna memenuhi standar aksesibilitas dasar.
- Status pembayaran tidak disampaikan hanya melalui warna.
- Pesan kesalahan dapat dibaca teknologi bantu.

### 13.6 Privasi

- Sistem menyediakan kebijakan privasi.
- Data pelanggan dibatasi pada kebutuhan transaksi dan pengiriman.
- Tidak ada penjualan atau pembagian data pelanggan untuk tujuan lain tanpa persetujuan.
- Data pribadi pelanggan disimpan selama 2 bulan setelah pesanan berstatus `DELIVERED` atau `CANCELLED`.
- Setelah periode tersebut, nama, email, nomor WhatsApp, dan alamat harus dihapus atau dianonimkan melalui proses terjadwal.
- Sistem boleh mempertahankan data transaksi agregat/nonpersonal untuk laporan bisnis.
- Kebijakan privasi wajib menjelaskan masa retensi 2 bulan tersebut.

## 14. Analitik dan Event

Event minimum yang dapat dicatat tanpa menyimpan data pembayaran sensitif:

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
```

KPI awal:

- Jumlah pengunjung katalog.
- Rasio detail produk ke add-to-cart.
- Rasio add-to-cart ke checkout.
- Rasio checkout ke order dibuat.
- Rasio order dibuat ke pembayaran berhasil.
- Jumlah pembayaran kedaluwarsa.
- Nilai pesanan rata-rata.
- Produk dan varian paling banyak terjual.
- Persentase kegagalan API ongkir dan payment gateway.

## 15. Acceptance Criteria Alur Kritis

### AC-01: Checkout tanpa akun

**Given** pelanggan memiliki produk valid di keranjang  
**When** pelanggan mengisi data penerima dan memilih layanan pengiriman  
**Then** pelanggan dapat membuat pesanan tanpa membuat akun atau login.

### AC-02: Validasi harga server

**Given** harga di browser telah dimanipulasi atau sudah tidak berlaku  
**When** checkout dikirim ke backend  
**Then** backend mengabaikan total dari browser, menghitung ulang, dan memberi tahu pelanggan jika terdapat perubahan.

### AC-03: Ongkir otomatis

**Given** alamat asal, tujuan, dan berat tersedia  
**When** pelanggan meminta pilihan pengiriman  
**Then** sistem menampilkan layanan serta tarif dari API pengiriman dan tidak menggunakan tarif tebakan.

### AC-04: Reservasi stok

**Given** stok varian tersisa satu  
**When** pelanggan berhasil membuat transaksi pembayaran  
**Then** satu stok ditahan sehingga checkout lain tidak dapat menjual stok yang sama.

### AC-05: Pembayaran berhasil

**Given** transaksi QRIS masih aktif  
**When** gateway mengirim webhook pembayaran berhasil dengan signature dan nominal valid  
**Then** pembayaran berubah menjadi `PAID`, order menjadi `PROCESSING`, dan stok tidak dikurangi dua kali.

### AC-06: Pembayaran kedaluwarsa

**Given** transaksi belum dibayar  
**When** waktu 10 menit telah berakhir  
**Then** pembayaran menjadi `EXPIRED`, pesanan tidak diproses, dan stok reservasi dilepas.

### AC-07: Webhook palsu

**Given** request webhook memiliki signature atau nominal yang tidak valid  
**When** endpoint menerima request tersebut  
**Then** sistem menolaknya dan tidak mengubah pembayaran, order, ataupun stok.

### AC-08: Pelacakan tanpa login

**Given** pelanggan memiliki tautan dengan token akses yang valid  
**When** pelanggan membuka tautan  
**Then** sistem menampilkan status pesanan yang relevan tanpa meminta login.

### AC-09: Proteksi data pesanan

**Given** seseorang hanya mengetahui nomor pesanan atau token yang salah  
**When** orang tersebut mencoba membuka pesanan  
**Then** sistem tidak menampilkan identitas, alamat, ataupun detail pesanan.

### AC-10: Pemrosesan admin

**Given** pesanan telah dibayar  
**When** admin menandainya sebagai dikirim dan memasukkan nomor resi  
**Then** status pelanggan berubah menjadi `SHIPPED` dan informasi resi muncul pada halaman status.

### AC-11: Ready stock only

**Given** stok varian bernilai nol  
**When** pelanggan mencoba menambahkan atau membeli varian tersebut  
**Then** sistem menolak transaksi dan tidak menawarkan pre-order atau backorder.

### AC-12: Retensi data pelanggan

**Given** pesanan telah berstatus `DELIVERED` atau `CANCELLED` selama 2 bulan  
**When** proses retensi terjadwal dijalankan  
**Then** data pribadi pelanggan dihapus atau dianonimkan tanpa merusak laporan transaksi nonpersonal.

## 16. Strategi Pengujian

### 16.1 Unit test

- Perhitungan diskon persentase dan nominal.
- Validasi periode diskon.
- Perhitungan subtotal dan total.
- Transisi status pembayaran dan pesanan.
- Validasi data checkout.
- Perhitungan berat paket.
- Verifikasi signature webhook.

### 16.2 Integration test

- Pembuatan order dan reservasi stok.
- Respons API pengiriman.
- Pembuatan transaksi sandbox Midtrans.
- Webhook sukses, kedaluwarsa, gagal, dan duplikat.
- Pelepasan reservasi stok.
- Autentikasi dan session admin.

### 16.3 End-to-end test

- Menjelajah katalog hingga pembayaran.
- Checkout melalui perangkat mobile.
- Pembayaran berhasil.
- Pembayaran kedaluwarsa dan mencoba ulang.
- Produk habis saat proses checkout.
- API ongkir gagal.
- Admin memproses pesanan hingga mengisi resi.
- Pelanggan membuka pelacakan tanpa login.

### 16.4 Pengujian produksi terbatas

- Gunakan sandbox sebelum mengaktifkan kredensial produksi.
- Lakukan transaksi nyata bernilai kecil setelah akun merchant aktif.
- Pastikan nominal, settlement, webhook, order, stok, dan dashboard konsisten.
- Periksa halaman kebijakan, kontak, alamat bisnis, serta proses penanganan komplain.

## 17. Tahapan Implementasi

### Fase 1 - Fondasi

- Inisialisasi Next.js, TypeScript, Tailwind, dan struktur proyek.
- Konfigurasi Supabase PostgreSQL dan SQL migration.
- Model produk, kategori, varian, gambar, dan admin.
- Login admin.
- CRUD katalog dan stok.

### Fase 2 - Pengalaman belanja

- Beranda, katalog, detail produk, filter, dan pencarian.
- Keranjang berbasis browser.
- Guest checkout dan validasi alamat.
- Harga dan diskon.

### Fase 3 - Pengiriman

- Konfigurasi alamat asal.
- Integrasi API ongkir.
- Perhitungan berat dan pilihan layanan.
- Snapshot tarif pada pesanan.

### Fase 4 - Pembayaran dan stok

- Model order, order item, payment, dan reservation.
- QRIS dinamis 10 menit.
- Webhook dan idempotensi.
- Kedaluwarsa, retry payment, dan rekonsiliasi.

### Fase 5 - Operasional

- Daftar/detail pesanan admin.
- Transisi status pemenuhan.
- Nomor resi.
- Pelacakan tanpa login.
- Ringkasan penjualan dasar.

### Fase 6 - Produksi

- SEO, aksesibilitas, keamanan, testing, dan logging.
- Kebijakan toko dan privasi.
- Konfigurasi domain, Vercel, database, image storage, dan environment variables.
- Uji sandbox serta transaksi produksi terbatas.

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Webhook terlambat atau gagal | Pesanan belum terkonfirmasi | Simpan event, sediakan get-status reconciliation, dan scheduled recovery. |
| Webhook dikirim berulang | Stok/status diproses ganda | Gunakan event ID unik dan transaksi idempotent. |
| Dua pelanggan membeli stok terakhir | Overselling | Gunakan reservasi dan transaksi database/locking. |
| API ongkir tidak tersedia | Checkout terhambat | Tampilkan gagal dan retry; jangan menebak tarif. |
| Batas 10 menit terlalu singkat | Pembayaran sering kedaluwarsa | Tampilkan timer jelas dan sediakan retry payment. Evaluasi metrik expiry. |
| Biaya atau aturan provider berubah | Perhitungan bisnis tidak akurat | Jadikan konfigurasi provider terpisah dan tinjau ketentuan berkala. |
| Serverless timeout/koneksi database | Request gagal | Gunakan pooling, query efisien, dan respons webhook cepat. |
| Token status pesanan bocor | Data pesanan dapat dilihat pihak lain | Gunakan token acak, batasi data, dan sediakan rotasi bila diperlukan. |
| Foto produk berat | Halaman lambat | Gunakan Cloudinary, ukuran responsif, kompresi, dan lazy loading. |
| Data alamat salah | Paket gagal dikirim | Validasi field, tampilkan ringkasan, dan konfirmasi nomor WhatsApp. |

## 19. Dependensi Eksternal

- Persetujuan dan aktivasi akun merchant Midtrans.
- Kredensial produksi QRIS.
- Akun serta paket API pengiriman.
- Database Supabase PostgreSQL.
- Akun Cloudinary atau object storage.
- Akun Vercel dan domain produksi.
- Data produk, foto, harga, ukuran, berat, dan stok asli.
- Kebijakan bisnis tentang retur, refund, pembatalan, dan pengiriman.

## 20. Keputusan yang Sudah Final

- Single store; bukan marketplace.
- Nama merek adalah Blissfy.co.
- Font utama website dan dashboard adalah Poppins.
- Identitas header menggunakan wordmark teks `Blissfy.co`, tanpa logo grafis.
- Alamat asal adalah Jl. Mahoni, Temu Ireng, Sukorejo, Kec. Ulujami, Kabupaten Pemalang, Jawa Tengah 52371.
- Kurir MVP adalah J&T dan JNE.
- Database menggunakan Supabase PostgreSQL.
- Email pelanggan wajib diisi.
- Data pribadi pelanggan disimpan selama 2 bulan setelah pesanan selesai atau dibatalkan.
- Penjualan hanya menggunakan ready stock.
- Pelanggan tidak perlu akun/login.
- Satu admin.
- Produk memiliki diskon.
- Pengiriman mencakup seluruh Indonesia.
- Ongkir dihitung otomatis berdasarkan lokasi dan paket.
- Pembayaran MVP hanya QRIS.
- Pembayaran menggunakan QRIS dinamis dan webhook.
- Batas pembayaran 10 menit.
- Stok direservasi selama menunggu pembayaran.
- Deployment awal menggunakan Vercel.
- Framework menggunakan React melalui Next.js dan TypeScript.
- Proyek ditujukan untuk portofolio sekaligus bisnis sungguhan.

## 21. Keputusan Terbuka Sebelum Implementasi

| Pertanyaan | Dampak |
|---|---|
| Apakah notifikasi WhatsApp masuk MVP? | Biaya dan integrasi layanan komunikasi. |
| Berapa tambahan berat kemasan default? | Akurasi ongkir. |
| Bagaimana kebijakan retur dan batas waktunya? | Halaman kebijakan dan alur operasional. |
| Bagaimana prosedur refund? | Operasional pesanan bermasalah. |

## 22. Definition of Done MVP

MVP dianggap selesai apabila:

- Seluruh acceptance criteria kritis lulus.
- Pelanggan dapat membeli tanpa akun pada mobile dan desktop.
- Perhitungan diskon, ongkir, total, stok, serta status pembayaran tervalidasi di backend.
- QRIS sandbox dan produksi terbatas telah diuji.
- Webhook sukses, invalid, ganda, dan kedaluwarsa telah diuji.
- Admin dapat mengelola produk serta memproses pesanan sampai resi.
- Pelanggan dapat melacak pesanan melalui token rahasia.
- Tidak ada secret di repository atau frontend bundle.
- Database Supabase memiliki backup dan SQL migration yang terdokumentasi.
- Halaman privasi, syarat, pengiriman, retur, dan kontak tersedia.
- Proses terjadwal untuk penghapusan atau anonimisasi data pribadi setelah 2 bulan telah diuji.
- Aplikasi di-deploy di Vercel menggunakan HTTPS dan domain yang ditentukan.
- Error penting tercatat dan dapat ditelusuri.
- Dokumentasi instalasi, environment variables, serta deployment tersedia.

---

## Persetujuan Dokumen

PRD ini menjadi acuan awal untuk tahap UI/UX design, technical design, pemodelan database, penyusunan backlog, dan implementasi. Perubahan yang berdampak pada pembayaran, stok, ongkir, data pelanggan, atau ruang lingkup MVP harus dicatat sebagai revisi PRD.
