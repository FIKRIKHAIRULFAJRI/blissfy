import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductPurchaseForm } from "@/components/store/ProductPurchaseForm";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Container } from "@/components/ui/Container";
import { getCatalogProducts, getProductBySlug } from "@/lib/products";

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

  const recommendations = (await getCatalogProducts({ limit: 5 }))
    .filter((candidate) => candidate.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <StoreHeader />
      <Container
        as="main"
        className="pt-[calc(var(--space-6)+var(--space-5))]"
        id="main-content"
      >
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb">
            <ol className="text-label flex flex-wrap items-center gap-[var(--space-2)] uppercase text-[var(--color-text-muted)]">
              <li>
                <Link
                  className="transition-colors hover:text-[var(--color-text-primary)]"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link
                  className="transition-colors hover:text-[var(--color-text-primary)]"
                  href="/products"
                >
                  Produk
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>{product.categoryName}</li>
              <li aria-hidden>›</li>
              <li
                aria-current="page"
                className="text-[var(--color-text-primary)]"
              >
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="mt-[var(--space-5)] grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2">
            <ProductGallery
              images={product.images}
              primaryImage={product.primaryImage}
              productName={product.name}
            />
            <ProductPurchaseForm product={product} />
          </div>

          {recommendations.length > 0 ? (
            <section
              aria-labelledby="product-recommendations-heading"
              className="mt-[var(--space-6)] border-t border-[var(--color-border)] pt-[var(--space-6)]"
            >
              <h2
                className="text-heading uppercase tracking-[0.05em] text-[var(--color-text-primary)]"
                id="product-recommendations-heading"
              >
                You May Also Like
              </h2>
              <div className="mt-[var(--space-5)] grid grid-cols-1 gap-x-[var(--space-3)] gap-y-[var(--space-5)] min-[360px]:grid-cols-2 lg:grid-cols-4 lg:gap-x-[var(--space-4)]">
                {recommendations.map((recommendation) => (
                  <div className="min-w-0" key={recommendation.id}>
                    <ProductCard product={recommendation} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </Container>
      <StoreFooter />
    </>
  );
}
