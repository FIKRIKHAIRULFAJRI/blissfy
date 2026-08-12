import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { formatRupiah } from "@/lib/placeholders";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan | Blissfy.co",
    };
  }

  return {
    title: `${product.name} | Blissfy.co`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const colors = product.colors;
  const sizes = Array.from(new Set(product.variants.map((variant) => variant.size)));

  return (
    <>
      <StoreHeader />
      <main className="container-page py-8 md:py-14" id="main-content">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm font-medium text-ink-muted"
        >
          <Link className="hover:text-ink" href="/products">
            Katalog
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span className="text-ink-soft">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <section aria-label={`Galeri ${product.name}`} className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] bg-surface-muted">
              <Image
                alt={product.primaryImage.altText}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 56vw, 100vw"
                src={product.primaryImage.url}
              />
            </div>
            {product.images.length > 1 ? (
              <div className="grid grid-cols-4 gap-3">
                {product.images.slice(0, 4).map((image) => (
                  <div
                    className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-surface-muted"
                    key={image.id}
                  >
                    <Image
                      alt={image.altText}
                      className="object-cover"
                      fill
                      sizes="25vw"
                      src={image.url}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase leading-tight text-olive">
              {product.categoryName}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
                {product.name}
              </h1>
              <Badge
                className="w-fit"
                tone={product.isAvailable ? "success" : "warning"}
              >
                {product.isAvailable ? "Ready stock" : "Stok habis"}
              </Badge>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-semibold text-ink">
                {formatRupiah(product.salePrice)}
              </p>
              {product.salePrice < product.normalPrice ? (
                <>
                  <p className="text-base font-medium text-ink-muted line-through">
                    {formatRupiah(product.normalPrice)}
                  </p>
                  {product.discountLabel ? (
                    <Badge tone="warning">{product.discountLabel}</Badge>
                  ) : null}
                </>
              ) : null}
            </div>

            <p className="mt-6 text-base leading-8 text-ink-soft">
              {product.description}
            </p>

            <div className="mt-8 space-y-8 border-y border-border py-8">
              <div>
                <h2 className="text-sm font-semibold text-ink">Warna</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <span
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-ink-soft"
                      key={color.name}
                    >
                      <span
                        aria-hidden
                        className="size-5 rounded-full border border-border-strong"
                        style={{ backgroundColor: color.value ?? "#FFFEFA" }}
                      />
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-ink">Ukuran</h2>
                  <Link
                    className="text-sm font-semibold text-olive hover:text-ink"
                    href="/products"
                  >
                    Panduan ukuran
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {sizes.map((size) => (
                    <span
                      className="grid min-h-11 min-w-11 place-items-center rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold text-ink"
                      key={size}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Varian ready stock
                </h2>
                <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
                  {product.variants.map((variant) => (
                    <div
                      className="grid gap-3 border-b border-border p-4 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                      key={variant.id}
                    >
                      <div>
                        <p className="font-semibold text-ink">
                          {variant.colorName} / {variant.size}
                        </p>
                        <p className="mt-1 text-xs font-medium text-ink-muted">
                          SKU {variant.sku} - {variant.weightGram} gram
                        </p>
                      </div>
                      <p className="font-semibold text-ink-soft">
                        {variant.stock} stok
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[var(--radius-lg)] bg-info-bg p-5">
              <h2 className="text-sm font-semibold text-info">
                Informasi pengiriman
              </h2>
              <p className="mt-2 text-sm leading-6 text-info">
                Berat varian disimpan dalam gram untuk perhitungan ongkir pada
                tahap pengiriman berikutnya.
              </p>
            </div>

            <Link
              className={buttonClasses({
                className: "mt-8 w-full sm:w-fit",
                variant: "secondary",
              })}
              href="/products"
            >
              Kembali ke katalog
            </Link>
          </section>
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
