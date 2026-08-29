export const PRODUCT_IMAGE_FALLBACK_URL =
  "/products/placeholder-ivory.svg";

export type ProductImage = {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductImageSource = {
  id: string;
  name: string;
  images?: ProductImage[];
  primaryImage?: ProductImage;
};

export function getOrderedProductImages(
  images: ProductImage[] | undefined,
): ProductImage[] {
  return [...(images ?? [])].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    return (
      left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
    );
  });
}

export function getPrimaryProductImage(
  product: ProductImageSource,
): ProductImage {
  const orderedImages = getOrderedProductImages(product.images);

  return (
    orderedImages.find((image) => image.isPrimary) ??
    orderedImages[0] ??
    product.primaryImage ?? {
      id: `fallback:${product.id}`,
      url: PRODUCT_IMAGE_FALLBACK_URL,
      altText: product.name,
      sortOrder: 0,
      isPrimary: true,
    }
  );
}
