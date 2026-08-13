import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchaseForm } from "@/components/store/ProductPurchaseForm";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
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

          <ProductPurchaseForm product={product} />
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
