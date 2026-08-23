import { AdminNotice } from "@/components/admin/AdminNotice";
import { buttonClasses } from "@/components/ui/button";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../catalog-actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: string;
};

type CategoriesPageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
};

export default async function AdminCategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const [params, categories] = await Promise.all([
    searchParams,
    db.query<CategoryRow>(`
      SELECT
        c.id::text,
        c.slug,
        c.name,
        c.description,
        c."isActive",
        COUNT(p.id)::text AS "productCount"
      FROM categories c
      LEFT JOIN products p ON p."categoryId" = c.id
      GROUP BY c.id, c.slug, c.name, c.description, c."isActive"
      ORDER BY c.name ASC
    `),
  ]);
  const categoryRows = categories.rows;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase text-olive">
          Kategori
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
          Kelola kategori
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Kategori mengelompokkan produk storefront. Kategori yang masih
          memiliki produk tidak bisa dihapus.
        </p>
      </header>

      <AdminNotice error={params?.error} notice={params?.notice} />

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold text-ink">Tambah kategori</h2>
        <form action={createCategory} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
          <Field label="Nama" name="name" required />
          <Field label="Slug" name="slug" placeholder="contoh-kategori" required />
          <Field label="Deskripsi" name="description" />
          <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
            <input defaultChecked name="isActive" type="checkbox" />
            Aktif
          </label>
          <button
            className={buttonClasses({
              className: "rounded-[var(--radius-md)] lg:col-start-4",
            })}
            type="submit"
          >
            Simpan kategori
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {categoryRows.length > 0 ? (
          categoryRows.map((category) => (
            <article
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
              key={category.id}
            >
              <form action={updateCategory} className="grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
                <input name="id" type="hidden" value={category.id} />
                <Field defaultValue={category.name} label="Nama" name="name" required />
                <Field defaultValue={category.slug} label="Slug" name="slug" required />
                <Field
                  defaultValue={category.description ?? ""}
                  label="Deskripsi"
                  name="description"
                />
                <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 text-sm font-semibold text-ink">
                  <input
                    defaultChecked={category.isActive}
                    name="isActive"
                    type="checkbox"
                  />
                  Aktif
                </label>
                <div className="flex flex-wrap gap-3 lg:col-span-4">
                  <button
                    className={buttonClasses({
                      className: "rounded-[var(--radius-md)]",
                      size: "compact",
                    })}
                    type="submit"
                  >
                    Perbarui
                  </button>
                  <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-canvas px-3 text-xs font-semibold text-ink-muted">
                    {category.productCount} produk
                  </span>
                </div>
              </form>

              <form action={deleteCategory} className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <input name="id" type="hidden" value={category.id} />
                <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                  <input name="confirmDelete" type="checkbox" />
                  Saya paham kategori hanya bisa dihapus jika belum dipakai.
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
                  Hapus kategori
                </button>
              </form>
            </article>
          ))
        ) : (
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
            <h2 className="text-2xl font-semibold text-ink">
              Belum ada kategori
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft">
              Buat kategori pertama agar produk baru bisa dikelompokkan dan
              tampil rapi di katalog.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
