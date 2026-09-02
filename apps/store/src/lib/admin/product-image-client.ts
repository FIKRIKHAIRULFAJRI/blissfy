export const ADMIN_PRODUCT_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const ADMIN_PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ADMIN_PRODUCT_IMAGE_MAX_COUNT = 8;

type SelectedImageFile = {
  size: number;
  type: string;
};

export function validateProductImageSelection({
  currentImageCount,
  files,
}: {
  currentImageCount: number;
  files: SelectedImageFile[];
}): string | null {
  if (currentImageCount + files.length > ADMIN_PRODUCT_IMAGE_MAX_COUNT) {
    return `Maksimum ${ADMIN_PRODUCT_IMAGE_MAX_COUNT} gambar per produk.`;
  }

  if (
    files.some(
      (file) =>
        !ADMIN_PRODUCT_IMAGE_ACCEPTED_TYPES.some(
          (acceptedType) => acceptedType === file.type,
        ),
    )
  ) {
    return "Format gambar harus JPEG, PNG, atau WebP.";
  }

  if (
    files.some((file) => file.size > ADMIN_PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES)
  ) {
    return "Ukuran setiap gambar maksimal 10 MiB.";
  }

  return null;
}

export function moveProductImage<T>(
  images: T[],
  index: number,
  direction: -1 | 1,
): T[] | null {
  const targetIndex = index + direction;

  if (targetIndex < 0 || targetIndex >= images.length) {
    return null;
  }

  const reordered = [...images];
  [reordered[index], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[index],
  ];

  return reordered;
}
