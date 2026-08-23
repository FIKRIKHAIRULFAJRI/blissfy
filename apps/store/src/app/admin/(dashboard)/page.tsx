import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/placeholders";

export const dynamic = "force-dynamic";

type MetricRow = {
  activeProducts: string;
  variants: string;
  totalStock: string | null;
};

type LowStockRow = {
  id: string;
  productId: string;
  sku: string;
  colorName: string;
  size: string;
  stock: number;
  productName: string;
  normalPrice: number;
};

export default async function AdminHomePage() {
  const [metricsResult, lowStockResult] = await Promise.all([
    db.query<MetricRow>(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE "isActive" = true) AS "activeProducts",
        (SELECT COUNT(*) FROM product_variants) AS variants,
        (SELECT COALESCE(SUM(stock), 0) FROM product_variants) AS "totalStock"
    `),
    db.query<LowStockRow>(`
      SELECT
        v.id::text,
        v."productId"::text AS "productId",
        v.sku,
        v."colorName",
        v.size,
        v.stock,
        p.name AS "productName",
        p."normalPrice"
      FROM product_variants v
      INNER JOIN products p ON p.id = v."productId"
      WHERE v."isActive" = true
        AND v.stock <= 5
      ORDER BY v.stock ASC, v."updatedAt" DESC
      LIMIT 8
    `),
  ]);
  const metrics = metricsResult.rows[0] ?? {
    activeProducts: "0",
    variants: "0",
    totalStock: "0",
  };
  const lowStock = lowStockResult.rows;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-olive">
            Ringkasan admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
            Dashboard katalog
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Pantau produk aktif, varian, total stok, dan varian yang perlu
            segera diperiksa.
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

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Produk aktif" value={metrics.activeProducts} />
        <MetricCard label="Jumlah varian" value={metrics.variants} />
        <MetricCard
          label="Total stok"
          value={(metrics.totalStock ?? "0").toString()}
        />
        <MetricCard
          label="Stok rendah"
          tone="warning"
          value={lowStock.length.toString()}
        />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">
              Produk dengan stok rendah
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Varian aktif dengan stok 5 atau kurang.
            </p>
          </div>
          <Link
            className={buttonClasses({
              className: "rounded-[var(--radius-md)]",
              size: "compact",
              variant: "secondary",
            })}
            href="/admin/products"
          >
            Kelola produk
          </Link>
        </div>

        {lowStock.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-semibold">Produk</th>
                  <th className="py-3 pr-4 font-semibold">SKU</th>
                  <th className="py-3 pr-4 font-semibold">Varian</th>
                  <th className="py-3 pr-4 font-semibold">Harga</th>
                  <th className="py-3 text-right font-semibold">Stok</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((variant) => (
                  <tr className="border-b border-border last:border-0" key={variant.id}>
                    <td className="py-4 pr-4 font-semibold text-ink">
                      <Link
                        className="hover:text-olive"
                        href={`/admin/products/${variant.productId}`}
                      >
                        {variant.productName}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 font-medium text-ink-soft">
                      {variant.sku}
                    </td>
                    <td className="py-4 pr-4 text-ink-soft">
                      {variant.colorName} / {variant.size}
                    </td>
                    <td className="py-4 pr-4 text-ink-soft">
                      {formatRupiah(variant.normalPrice)}
                    </td>
                    <td className="py-4 text-right font-semibold text-warning">
                      {variant.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-[var(--radius-md)] border border-border bg-canvas p-6 text-center">
            <h3 className="font-semibold text-ink">Tidak ada stok rendah</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Semua varian aktif masih berada di atas batas stok rendah.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "warning";
  value: string;
}) {
  return (
    <article className="rounded-[var(--radius-md)] border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <p
        className={
          tone === "warning"
            ? "mt-4 text-4xl font-semibold text-warning"
            : "mt-4 text-4xl font-semibold text-ink"
        }
      >
        {value}
      </p>
    </article>
  );
}
