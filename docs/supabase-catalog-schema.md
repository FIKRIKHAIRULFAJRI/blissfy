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

Constraint utama:

- slug produk unik dan berformat URL-friendly.
- SKU varian unik.
- harga, berat, dan nilai diskon harus positif.
- stok tidak boleh negatif.
- diskon persentase dibatasi 1 sampai 90.
- waktu akhir diskon harus setelah waktu mulai.
