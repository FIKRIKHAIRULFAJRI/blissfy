import Link from "next/link";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { buttonClasses } from "@/components/ui/button";
import { createProduct } from "../../../catalog-actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type NewProductPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const [params, categories] = await Promise.all([
    searchParams,
    db.query<{ id: string; name: string }>(`
      SELECT id::text, name
      FROM categories
      WHERE "isActive" = true
      ORDER BY name ASC
    `),
  ]);
  const categoryRows = categories.rows;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-olive">
            Produk baru
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
            Tambah produk katalog
          </h1>
        </div>
        <Link
          className={buttonClasses({
            className: "rounded-[var(--radius-md)]",
            variant: "secondary",
          })}
          href="/admin/products"
        >
          Kembali
        </Link>
      </header>

      <AdminNotice error={params?.error} />

      {categoryRows.length > 0 ? (
        <form action={createProduct} className="space-y-5">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">Info dasar</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nama produk" name="name" required />
              <Field label="Slug" name="slug" placeholder="nama-produk" required />
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-ink">
                  Deskripsi
                </span>
                <textarea
                  className="mt-2 min-h-32 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-olive"
                  name="description"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink">
                  Kategori
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
                  name="categoryId"
                  required
                >
                  {categoryRows.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                inputMode="numeric"
                label="Harga normal"
                min="1"
                name="normalPrice"
                required
                type="number"
              />
              <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
                <input defaultChecked name="isActive" type="checkbox" />
                Produk aktif
              </label>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">Product Images</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Simpan produk terlebih dahulu. Setelah ID produk dibuat, Anda akan
              diarahkan ke halaman edit untuk mengunggah gambar ke Cloudinary.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">Varian awal</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Opsional, tetapi produk siap jual membutuhkan minimal satu varian.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="SKU" name="variantSku" />
              <Field label="Warna" name="variantColorName" />
              <Field label="Hex warna" name="variantColorHex" placeholder="#6F7254" />
              <Field label="Ukuran" name="variantSize" />
              <Field
                inputMode="numeric"
                label="Berat gram"
                min="1"
                name="variantWeightGram"
                type="number"
              />
              <Field
                inputMode="numeric"
                label="Stok"
                min="0"
                name="variantStock"
                type="number"
              />
              <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
                <input defaultChecked name="variantIsActive" type="checkbox" />
                Varian aktif
              </label>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">Diskon awal</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Opsional. Diskon nominal harus lebih kecil dari harga normal.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-ink">Tipe</span>
                <select
                  className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
                  name="discountType"
                >
                  <option value="PERCENTAGE">Persentase</option>
                  <option value="FIXED_AMOUNT">Nominal</option>
                </select>
              </label>
              <Field inputMode="numeric" label="Nilai" min="1" name="discountValue" type="number" />
              <Field label="Mulai" name="discountStartsAt" type="datetime-local" />
              <Field label="Berakhir" name="discountEndsAt" type="datetime-local" />
              <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
                <input defaultChecked name="discountIsActive" type="checkbox" />
                Diskon aktif
              </label>
            </div>
          </section>

          <button
            className={buttonClasses({
              className: "rounded-[var(--radius-md)]",
            })}
            type="submit"
          >
            Simpan produk
          </button>
        </form>
      ) : (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-semibold text-ink">
            Buat kategori dahulu
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft">
            Produk membutuhkan kategori aktif sebelum bisa dibuat.
          </p>
          <Link
            className={buttonClasses({
              className: "mt-6 rounded-[var(--radius-md)]",
            })}
            href="/admin/categories"
          >
            Kelola kategori
          </Link>
        </section>
      )}
    </div>
  );
}

function Field({
  defaultValue,
  inputMode,
  label,
  min,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string;
  inputMode?: "numeric";
  label: string;
  min?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
        defaultValue={defaultValue}
        inputMode={inputMode}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
