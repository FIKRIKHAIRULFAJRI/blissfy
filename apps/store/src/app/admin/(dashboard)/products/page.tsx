import Link from "next/link";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { buttonClasses } from "@/components/ui/button";
import {
  deleteProduct,
  toggleProductStatus,
} from "../../catalog-actions";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/placeholders";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

type ProductListRow = {
  id: string;
  slug: string;
  name: string;
  normalPrice: number;
  isActive: boolean;
  categoryName: string;
  variantCount: string;
  totalStock: string | null;
  activeDiscountCount: string;
};

type ProductsPageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
    page?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function AdminProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const status = params.status === "inactive" ? "inactive" : params.status === "active" ? "active" : "all";
  const q = params.q?.trim() ?? "";
  const filters: string[] = [];
  const values: Array<string | number | boolean> = [];

  if (status === "active" || status === "inactive") {
    values.push(status === "active");
    filters.push(`p."isActive" = $${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);
    filters.push(
      `(p.name ILIKE $${values.length} OR p.slug ILIKE $${values.length})`,
    );
  }

  const whereSql = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const listValues = [...values, PAGE_SIZE, (page - 1) * PAGE_SIZE];

  const [productsResult, totalResult] = await Promise.all([
    db.query<ProductListRow>(
      `
        SELECT
          p.id::text,
          p.slug,
          p.name,
          p."normalPrice",
          p."isActive",
          c.name AS "categoryName",
          COALESCE(v."variantCount", 0)::text AS "variantCount",
          COALESCE(v."totalStock", 0)::text AS "totalStock",
          COALESCE(d."activeDiscountCount", 0)::text AS "activeDiscountCount"
        FROM products p
        INNER JOIN categories c ON c.id = p."categoryId"
        LEFT JOIN (
          SELECT
            "productId",
            COUNT(*) AS "variantCount",
            SUM(stock) AS "totalStock"
          FROM product_variants
          GROUP BY "productId"
        ) v ON v."productId" = p.id
        LEFT JOIN (
          SELECT
            "productId",
            COUNT(*) AS "activeDiscountCount"
          FROM discounts
          WHERE "isActive" = true
          GROUP BY "productId"
        ) d ON d."productId" = p.id
        ${whereSql}
        ORDER BY p."updatedAt" DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      listValues,
    ),
    db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM products p
        ${whereSql}
      `,
      values,
    ),
  ]);
  const products = productsResult.rows;
  const total = Number(totalResult.rows[0]?.total ?? "0");

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-olive">Produk</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
            Kelola produk
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Cari, filter, aktifkan/nonaktifkan, dan buka detail produk untuk
            mengelola varian serta diskon.
          </p>
        </div>
        <Link
          className={buttonClasses({
            className: "rounded-[var(--radius-md)]",
          })}
          href="/admin/products/new"
        >
          Tambah produk
        </Link>
      </header>

      <AdminNotice error={params.error} notice={params.notice} />

      <form className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_180px_auto]" method="get">
        <label>
          <span className="text-sm font-semibold text-ink">Pencarian</span>
          <input
            className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
            defaultValue={q}
            name="q"
            placeholder="Nama atau slug produk"
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-ink">Status</span>
          <select
            className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive"
            defaultValue={status}
            name="status"
          >
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>
        <button
          className={buttonClasses({
            className: "self-end rounded-[var(--radius-md)]",
            variant: "secondary",
          })}
          type="submit"
        >
          Terapkan
        </button>
      </form>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-canvas text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produk</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Harga</th>
                  <th className="px-4 py-3 font-semibold">Varian</th>
                  <th className="px-4 py-3 font-semibold">Stok</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = Number(product.totalStock ?? "0");
                  const editPath = `/admin/products/${product.id}`;

                  return (
                    <tr className="border-t border-border" key={product.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-[var(--radius-sm)] bg-surface-muted" />
                          <div>
                            <Link
                              className="font-semibold text-ink hover:text-olive"
                              href={editPath}
                            >
                              {product.name}
                            </Link>
                            <p className="mt-1 text-xs font-medium text-ink-muted">
                              /products/{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-ink-soft">
                        {product.categoryName}
                      </td>
                      <td className="px-4 py-4 font-semibold text-ink">
                        {formatRupiah(product.normalPrice)}
                        {Number(product.activeDiscountCount) > 0 ? (
                          <span className="ml-2 rounded-full bg-warning-bg px-2 py-1 text-xs text-warning">
                            Diskon aktif
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-ink-soft">
                        {product.variantCount}
                      </td>
                      <td className="px-4 py-4 font-semibold text-ink">
                        {stock}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            product.isActive
                              ? "rounded-full bg-success-bg px-3 py-1.5 text-xs font-semibold text-success"
                              : "rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted"
                          }
                        >
                          {product.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            className={buttonClasses({
                              className: "rounded-[var(--radius-md)]",
                              size: "compact",
                              variant: "secondary",
                            })}
                            href={editPath}
                          >
                            Edit
                          </Link>
                          <form action={toggleProductStatus}>
                            <input name="id" type="hidden" value={product.id} />
                            <input
                              name="isActive"
                              type="hidden"
                              value={product.isActive ? "false" : "true"}
                            />
                            <input
                              name="returnTo"
                              type="hidden"
                              value={`/admin/products?${new URLSearchParams({
                                q,
                                status,
                                page: page.toString(),
                              }).toString()}`}
                            />
                            <button
                              className="text-xs font-semibold text-olive hover:text-ink"
                              type="submit"
                            >
                              {product.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </form>
                          <form action={deleteProduct} className="text-right">
                            <input name="id" type="hidden" value={product.id} />
                            <label className="block text-xs font-medium text-ink-muted">
                              <input
                                className="mr-1"
                                name="confirmDelete"
                                type="checkbox"
                              />
                              Konfirmasi hapus
                            </label>
                            <button
                              className="mt-1 text-xs font-semibold text-danger hover:text-ink"
                              type="submit"
                            >
                              Hapus
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-ink">
              Produk tidak ditemukan
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft">
              Ubah kata kunci atau filter status, atau tambahkan produk baru ke
              katalog.
            </p>
            <Link
              className={buttonClasses({
                className: "mt-6 rounded-[var(--radius-md)]",
              })}
              href="/admin/products/new"
            >
              Tambah produk
            </Link>
          </div>
        )}
      </section>

      <nav className="flex items-center justify-between gap-4 text-sm font-semibold text-ink-soft">
        <PaginationLink
          disabled={page <= 1}
          label="Sebelumnya"
          page={page - 1}
          q={q}
          status={status}
        />
        <span>
          Halaman {page} dari {totalPages}
        </span>
        <PaginationLink
          disabled={page >= totalPages}
          label="Berikutnya"
          page={page + 1}
          q={q}
          status={status}
        />
      </nav>
    </div>
  );
}

function PaginationLink({
  disabled,
  label,
  page,
  q,
  status,
}: {
  disabled: boolean;
  label: string;
  page: number;
  q: string;
  status: string;
}) {
  if (disabled) {
    return <span className="text-ink-muted">{label}</span>;
  }

  return (
    <Link
      className="hover:text-ink"
      href={`/admin/products?${new URLSearchParams({
        q,
        status,
        page: page.toString(),
      }).toString()}`}
    >
      {label}
    </Link>
  );
}
