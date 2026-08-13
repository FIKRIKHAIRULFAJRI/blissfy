# Admin Auth Blissfy.co

Admin login memakai tabel `admin_users` sebagai sumber kredensial. Supabase Auth
tidak dipakai, dan Prisma Client tidak dipakai pada alur autentikasi.

Data katalog dan auth admin memakai query SQL langsung melalui paket `pg`.

## Tabel Auth

Struktur `admin_users` yang dipakai:

```text
id uuid primary key
email text unique
displayName text
createdAt timestamp
updatedAt timestamp
password text
```

Session disimpan sebagai cookie `HttpOnly` yang ditandatangani memakai nilai
`password` pada baris admin. Tidak ada tabel `admin_sessions`.

## Membuat Admin

Password sebaiknya disimpan sebagai hash:

```bash
npm run admin:hash-password -- "password-admin-yang-kuat"
```

Simpan hasilnya ke kolom `password`:

```sql
UPDATE admin_users
SET password = 'HASH_HASIL_SCRIPT', "updatedAt" = NOW()
WHERE email = 'admin@example.com';
```

Jika baris admin belum ada:

```sql
INSERT INTO admin_users (email, "displayName", password, "updatedAt")
VALUES ('admin@example.com', 'Nama Admin', 'HASH_HASIL_SCRIPT', NOW());
```

Untuk kebutuhan lokal sementara, kolom `password` juga bisa berisi password
plaintext, tetapi hash jauh lebih aman.

## Menonaktifkan Login

Kosongkan password atau hapus baris admin:

```sql
UPDATE admin_users
SET password = NULL, "updatedAt" = NOW()
WHERE email = 'admin@example.com';
```

## Catatan Keamanan

- Semua halaman `/admin` selain `/admin/login` dilindungi server-side.
- Setiap Server Action admin tetap memanggil pengecekan session admin sebelum
  mutasi katalog.
- Password hash memakai `scrypt`.
- Session admin disimpan di cookie `HttpOnly`. Mengubah atau mengosongkan kolom
  `password` akan membuat session lama tidak valid.
