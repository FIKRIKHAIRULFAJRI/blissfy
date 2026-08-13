# Integrasi Ongkir RajaOngkir/Komerce

Blissfy.co memakai provider RajaOngkir/Komerce Shipping Cost untuk data wilayah dan tarif ongkir. API key hanya boleh berada di server.

## Environment variable

- `RAJAONGKIR_BASE_URL`
- `RAJAONGKIR_API_KEY`
- `SHIPPING_ORIGIN_DISTRICT_ID`

`SHIPPING_ORIGIN_DISTRICT_ID` adalah ID kecamatan asal provider untuk alamat:

```text
Jl. Mahoni, Temu Ireng, Sukorejo,
Kec. Ulujami, Kabupaten Pemalang,
Jawa Tengah 52371
```

Cari ID ini melalui endpoint wilayah resmi provider, lalu masukkan nilainya di environment server. Runtime ongkir memakai `SHIPPING_ORIGIN_DISTRICT_ID` sebagai sumber alamat asal; Supabase tetap menjadi sumber kebenaran untuk produk, varian, stok, berat, dan berat kemasan.

## Endpoint resmi yang digunakan

- `GET /destination/province`
- `GET /destination/city/{province_id}`
- `GET /destination/district/{city_id}`
- `POST /calculate/district/domestic-cost`

Kurir MVP difilter menjadi `jne` dan `jnt` saja.

## Catatan tahap ini

- Tidak ada tarif dummy.
- Tidak membuat order final.
- Tidak mereservasi atau mengurangi stok.
- Tidak mengintegrasikan Midtrans/QRIS.
