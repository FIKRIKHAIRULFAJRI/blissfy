# Supabase Catalog Schema

Migration katalog Supabase dimulai dari tabel `categories` karena tabel
`products` membutuhkan `categoryId`.

## Categories

File SQL:

```text
supabase/migrations/202608130001_create_categories.sql
```

Kolom:

```text
id uuid primary key
slug text unique
name text
description text nullable
isActive boolean
createdAt timestamp
updatedAt timestamp
```

Aturan:

- `id` memakai `gen_random_uuid()`.
- `slug` wajib unik dan hanya boleh huruf kecil, angka, serta tanda hubung.
- `name` minimal 2 karakter setelah trim.
- `updatedAt` otomatis berubah saat row di-update.
- `products.categoryId` nanti akan memakai foreign key ke `categories.id`.

## Catalog Tables

File SQL:

```text
supabase/migrations/202608130002_create_catalog_tables.sql
```

Tabel:

- `products`
- `product_images`
- `product_variants`
- `discounts`
- `store_settings`

Relasi:

- `products.categoryId` -> `categories.id`
- `product_images.productId` -> `products.id`
- `product_variants.productId` -> `products.id`
- `discounts.productId` -> `products.id`

`product_images` menyimpan metadata aset, bukan binary image:

```text
id
productId
url
publicId nullable
altText nullable
sortOrder
isPrimary
createdAt
updatedAt
```

Migration hardening pipeline:

```text
supabase/migrations/202608300001_harden_product_image_pipeline.sql
```

Aturan image pipeline:

- maksimum satu primary image per produk;
- ordering unik per produk dan deterministik melalui `sortOrder`;
- image tanpa primary mewarisi image pertama saat migration;
- `publicId` Cloudinary disimpan internal dan tidak diekspos ke Store API;
- product tanpa image tetap valid dan memakai fallback presentational saat read;
- file image tetap berada di Cloudinary, bukan di PostgreSQL.

## Cloudinary product image management

Credential Cloudinary hanya ditempatkan pada `apps/api/.env` untuk development
lokal. Nama variabel tersedia di `apps/api/.env.example`:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Jangan memakai prefix `NEXT_PUBLIC_` untuk credential tersebut. Admin browser
mengirim file melalui authenticated Store proxy, lalu Nest API melakukan upload
server-side. Folder aset ditentukan server sebagai
`blissfy/products/{productId}` dan suffix public ID dibuat oleh server.

Upload menerima JPEG, PNG, dan WebP dengan pemeriksaan MIME serta file
signature. Batasnya 10 MiB per file dan maksimum 8 image per produk. Source
Cloudinary disimpan tanpa resize agresif; transformasi delivery dapat diterapkan
terpisah di masa depan.

Constraint utama:

- slug produk unik dan berformat URL-friendly.
- SKU varian unik.
- harga, berat, dan nilai diskon harus positif.
- stok tidak boleh negatif.
- diskon persentase dibatasi 1 sampai 90.
- waktu akhir diskon harus setelah waktu mulai.
