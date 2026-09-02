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
      <StoreHeader activePath="/products" variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <Container className="max-w-[1200px] pb-10 pt-[30px] sm:pt-9 lg:pt-12">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase leading-normal tracking-[0.08em] text-stone sm:gap-3">
              <li>
                <Link
                  className="transition-colors hover:text-black focus-visible:outline-black"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link
                  className="transition-colors hover:text-black focus-visible:outline-black"
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
                className="text-black"
              >
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-12 lg:mt-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start lg:gap-16 xl:gap-24">
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
              className="mt-24 border-t border-black/10 pb-12 pt-[72px] sm:mt-[120px] sm:pb-16 sm:pt-24"
            >
              <h2
                className="font-goudy-old-style text-[32px] font-normal leading-[1.05] tracking-[-0.012em] text-black sm:text-[40px]"
                id="product-recommendations-heading"
              >
                You May Also Like
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-12 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
                {recommendations.map((recommendation) => (
                  <div className="min-w-0" key={recommendation.id}>
                    <ProductCard product={recommendation} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </Container>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
