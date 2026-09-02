import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";
import { buttonClasses } from "@/components/ui/button";
import {
  createDiscount,
  createVariant,
  deleteDiscount,
  deleteVariant,
  updateDiscount,
  updateProduct,
  updateVariant,
} from "../../../catalog-actions";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/placeholders";

export const dynamic = "force-dynamic";

type ProductEditPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
};

type CategoryRow = {
  id: string;
  name: string;
  isActive: boolean;
};

type ProductRow = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  normalPrice: number;
  isActive: boolean;
  categoryName: string;
};

type ImageRow = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type VariantRow = {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string | null;
  size: string;
  weightGram: number;
  stock: number;
  isActive: boolean;
};

type DiscountRow = {
  id: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

export default async function ProductEditPage({
  params,
  searchParams,
}: ProductEditPageProps) {
  const { id } = await params;
  const [
    query,
    categoriesResult,
    productResult,
    imagesResult,
    variantsResult,
    discountsResult,
  ] = await Promise.all([
    searchParams,
    db.query<CategoryRow>(`
      SELECT id::text, name, "isActive"
      FROM categories
      ORDER BY name ASC
    `),
    db.query<ProductRow>(
      `
        SELECT
          p.id::text,
          p."categoryId"::text AS "categoryId",
          p.slug,
          p.name,
          p.description,
          p."normalPrice",
          p."isActive",
          c.name AS "categoryName"
        FROM products p
        INNER JOIN categories c ON c.id = p."categoryId"
        WHERE p.id::text = $1
        LIMIT 1
      `,
      [id],
    ),
    db.query<ImageRow>(
      `
        SELECT id::text, url, "altText", "sortOrder", "isPrimary"
        FROM product_images
        WHERE "productId"::text = $1
        ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
      `,
      [id],
    ),
    db.query<VariantRow>(
      `
        SELECT
          id::text,
          sku,
          "colorName",
          "colorHex",
          size,
          "weightGram",
          stock,
          "isActive"
        FROM product_variants
        WHERE "productId"::text = $1
        ORDER BY "colorName" ASC, size ASC
      `,
      [id],
    ),
    db.query<DiscountRow>(
      `
        SELECT
          id::text,
          type::text AS type,
          value,
          "startsAt",
          "endsAt",
          "isActive"
        FROM discounts
        WHERE "productId"::text = $1
        ORDER BY "startsAt" DESC
      `,
      [id],
    ),
  ]);
  const product = productResult.rows[0];
  const categories = categoriesResult.rows;
  const images = imagesResult.rows;
  const variants = variantsResult.rows;
  const discounts = discountsResult.rows;

  if (!product) {
    notFound();
  }

  const totalStock = variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-olive">
            Edit produk
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            {product.categoryName} - {variants.length} varian -{" "}
            {totalStock} stok
          </p>
        </div>
        <Link
          className={buttonClasses({
            className: "rounded-[var(--radius-md)]",
            variant: "secondary",
          })}
          href="/admin/products"
        >
          Kembali ke produk
        </Link>
      </header>

      <AdminNotice error={query?.error} notice={query?.notice} />

      <form action={updateProduct} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <input name="id" type="hidden" value={product.id} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Info produk</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Harga, slug, kategori, dan status storefront.
            </p>
          </div>
          <span
            className={
              product.isActive
                ? "w-fit rounded-full bg-success-bg px-3 py-1.5 text-xs font-semibold text-success"
                : "w-fit rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted"
            }
          >
            {product.isActive ? "Aktif" : "Nonaktif"}
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field defaultValue={product.name} label="Nama produk" name="name" required />
          <Field defaultValue={product.slug} label="Slug" name="slug" required />
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-ink">Deskripsi</span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-olive"
              defaultValue={product.description}
              name="description"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Kategori</span>
            <select
              className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
              defaultValue={product.categoryId}
              name="categoryId"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
          </label>
          <Field
            defaultValue={product.normalPrice.toString()}
            inputMode="numeric"
            label="Harga normal"
            min="1"
            name="normalPrice"
            required
            type="number"
          />
          <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
            <input
              defaultChecked={product.isActive}
              name="isActive"
              type="checkbox"
            />
            Produk aktif
          </label>
        </div>
        <button
          className={buttonClasses({
            className: "mt-5 rounded-[var(--radius-md)]",
          })}
          type="submit"
        >
          Simpan perubahan produk
        </button>
      </form>

      <ProductImagesManager
        initialImages={images.map((image) => ({
          ...image,
          altText: image.altText ?? product.name,
        }))}
        productId={product.id}
        productName={product.name}
      />

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold text-ink">Varian produk</h2>
        <p className="mt-1 text-sm text-ink-muted">
          SKU harus unik. Stok tidak boleh negatif dan varian bisa
          dinonaktifkan tanpa dihapus.
        </p>

        <form action={createVariant} className="mt-5 grid gap-4 md:grid-cols-3">
          <input name="productId" type="hidden" value={product.id} />
          <Field label="SKU" name="sku" required />
          <Field label="Warna" name="colorName" required />
          <Field label="Hex warna" name="colorHex" placeholder="#6F7254" />
          <Field label="Ukuran" name="size" required />
          <Field inputMode="numeric" label="Berat gram" min="1" name="weightGram" required type="number" />
          <Field inputMode="numeric" label="Stok" min="0" name="stock" required type="number" />
          <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
            <input defaultChecked name="isActive" type="checkbox" />
            Varian aktif
          </label>
          <button
            className={buttonClasses({
              className: "rounded-[var(--radius-md)] md:col-start-3",
            })}
            type="submit"
          >
            Tambah varian
          </button>
        </form>

        {variants.length > 0 ? (
          <div className="mt-6 space-y-4">
            {variants.map((variant) => (
              <article className="rounded-[var(--radius-md)] border border-border bg-canvas p-4" key={variant.id}>
                <form action={updateVariant} className="grid gap-4 md:grid-cols-3">
                  <input name="id" type="hidden" value={variant.id} />
                  <input name="productId" type="hidden" value={product.id} />
                  <Field defaultValue={variant.sku} label="SKU" name="sku" required />
                  <Field defaultValue={variant.colorName} label="Warna" name="colorName" required />
                  <Field defaultValue={variant.colorHex ?? ""} label="Hex warna" name="colorHex" />
                  <Field defaultValue={variant.size} label="Ukuran" name="size" required />
                  <Field
                    defaultValue={variant.weightGram.toString()}
                    inputMode="numeric"
                    label="Berat gram"
                    min="1"
                    name="weightGram"
                    required
                    type="number"
                  />
                  <Field
                    defaultValue={variant.stock.toString()}
                    inputMode="numeric"
                    label="Stok"
                    min="0"
                    name="stock"
                    required
                    type="number"
                  />
                  <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
                    <input
                      defaultChecked={variant.isActive}
                      name="isActive"
                      type="checkbox"
                    />
                    Varian aktif
                  </label>
                  <button
                    className={buttonClasses({
                      className: "rounded-[var(--radius-md)]",
                      size: "compact",
                    })}
                    type="submit"
                  >
                    Perbarui varian
                  </button>
                </form>

                <form action={deleteVariant} className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <input name="id" type="hidden" value={variant.id} />
                  <input name="productId" type="hidden" value={product.id} />
                  <p className="text-sm font-semibold text-ink">
                    {variant.colorName} / {variant.size} - {variant.stock} stok
                  </p>
                  <label className="text-sm font-medium text-ink-soft">
                    <input className="mr-2" name="confirmDelete" type="checkbox" />
                    Konfirmasi hapus varian
                  </label>
                  <button
                    className={buttonClasses({
                      className:
                        "rounded-[var(--radius-md)] border-danger text-danger hover:bg-danger hover:text-surface",
                      size: "compact",
                      variant: "secondary",
                    })}
                    type="submit"
                  >
                    Hapus varian
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-canvas p-6 text-center">
            <h3 className="font-semibold text-ink">Belum ada varian</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Tambahkan varian agar produk memiliki SKU, berat, dan stok ready
              stock.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold text-ink">Diskon</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Harga saat ini {formatRupiah(product.normalPrice)}. Diskon tidak boleh
          membuat harga final nol atau negatif.
        </p>

        <form action={createDiscount} className="mt-5 grid gap-4 md:grid-cols-2">
          <input name="productId" type="hidden" value={product.id} />
          <DiscountTypeSelect name="type" />
          <Field inputMode="numeric" label="Nilai" min="1" name="value" required type="number" />
          <Field label="Mulai" name="startsAt" required type="datetime-local" />
          <Field label="Berakhir" name="endsAt" required type="datetime-local" />
          <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
            <input defaultChecked name="isActive" type="checkbox" />
            Diskon aktif
          </label>
          <button
            className={buttonClasses({
              className: "rounded-[var(--radius-md)]",
            })}
            type="submit"
          >
            Tambah diskon
          </button>
        </form>

        {discounts.length > 0 ? (
          <div className="mt-6 space-y-4">
            {discounts.map((discount) => (
              <article className="rounded-[var(--radius-md)] border border-border bg-canvas p-4" key={discount.id}>
                <form action={updateDiscount} className="grid gap-4 md:grid-cols-2">
                  <input name="id" type="hidden" value={discount.id} />
                  <input name="productId" type="hidden" value={product.id} />
                  <DiscountTypeSelect
                    defaultValue={discount.type}
                    name="type"
                  />
                  <Field
                    defaultValue={discount.value.toString()}
                    inputMode="numeric"
                    label="Nilai"
                    min="1"
                    name="value"
                    required
                    type="number"
                  />
                  <Field
                    defaultValue={formatDateTimeLocal(discount.startsAt)}
                    label="Mulai"
                    name="startsAt"
                    required
                    type="datetime-local"
                  />
                  <Field
                    defaultValue={formatDateTimeLocal(discount.endsAt)}
                    label="Berakhir"
                    name="endsAt"
                    required
                    type="datetime-local"
                  />
                  <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
                    <input
                      defaultChecked={discount.isActive}
                      name="isActive"
                      type="checkbox"
                    />
                    Diskon aktif
                  </label>
                  <button
                    className={buttonClasses({
                      className: "rounded-[var(--radius-md)]",
                      size: "compact",
                    })}
                    type="submit"
                  >
                    Perbarui diskon
                  </button>
                </form>

                <form action={deleteDiscount} className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <input name="id" type="hidden" value={discount.id} />
                  <input name="productId" type="hidden" value={product.id} />
                  <p className="text-sm font-semibold text-ink">
                    {discount.type === "PERCENTAGE"
                      ? `${discount.value}%`
                      : formatRupiah(discount.value)}
                  </p>
                  <label className="text-sm font-medium text-ink-soft">
                    <input className="mr-2" name="confirmDelete" type="checkbox" />
                    Konfirmasi hapus diskon
                  </label>
                  <button
                    className={buttonClasses({
                      className:
                        "rounded-[var(--radius-md)] border-danger text-danger hover:bg-danger hover:text-surface",
                      size: "compact",
                      variant: "secondary",
                    })}
                    type="submit"
                  >
                    Hapus diskon
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-canvas p-6 text-center">
            <h3 className="font-semibold text-ink">Belum ada diskon</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Tambahkan diskon jika produk sedang memiliki harga promo.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function DiscountTypeSelect({
  defaultValue = "PERCENTAGE",
  name,
}: {
  defaultValue?: "PERCENTAGE" | "FIXED_AMOUNT";
  name: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">Tipe diskon</span>
      <select
        className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
        defaultValue={defaultValue}
        name={name}
      >
        <option value="PERCENTAGE">Persentase</option>
        <option value="FIXED_AMOUNT">Nominal</option>
      </select>
    </label>
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

function formatDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
