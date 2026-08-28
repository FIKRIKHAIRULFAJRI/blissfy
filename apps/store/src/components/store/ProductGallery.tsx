"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductDetail } from "@/lib/products";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: ProductDetail["images"];
  primaryImage: ProductDetail["primaryImage"];
  productName: string;
};

export function ProductGallery({
  images,
  primaryImage,
  productName,
}: ProductGalleryProps) {
  const galleryImages = useMemo(
    () =>
      images.length > 0
        ? images
        : [
            {
              altText: primaryImage.altText,
              id: "primary",
              url: primaryImage.url,
            },
          ],
    [images, primaryImage],
  );
  const [activeImageId, setActiveImageId] = useState(galleryImages[0].id);
  const activeImage =
    galleryImages.find((image) => image.id === activeImageId) ?? galleryImages[0];

  return (
    <section aria-label={`Galeri ${productName}`}>
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-surface-container)]">
        <Image
          alt={activeImage.altText}
          className="object-cover"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          src={activeImage.url}
        />
      </div>

      {galleryImages.length > 1 ? (
        <div
          aria-label="Pilih gambar produk"
          className="mt-[var(--space-3)] flex gap-[var(--space-3)] overflow-x-auto pb-[var(--space-1)]"
          role="group"
        >
          {galleryImages.map((image, index) => {
            const selected = image.id === activeImage.id;

            return (
              <button
                aria-label={`Tampilkan gambar ${index + 1} dari ${galleryImages.length}`}
                aria-pressed={selected}
                className={cn(
                  "relative h-24 w-20 shrink-0 overflow-hidden border bg-[var(--color-surface-container)] transition-opacity",
                  selected
                    ? "border-[var(--color-text-brand)] opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
                key={image.id}
                onClick={() => setActiveImageId(image.id)}
                type="button"
              >
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={image.url}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
