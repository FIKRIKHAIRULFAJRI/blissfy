"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ADMIN_PRODUCT_IMAGE_ACCEPTED_TYPES,
  ADMIN_PRODUCT_IMAGE_MAX_COUNT,
  moveProductImage,
  validateProductImageSelection,
} from "@/lib/admin/product-image-client";
import type { AdminProductImage } from "@/lib/admin/product-image-types";

export function ProductImagesManager({
  initialImages,
  productId,
  productName,
}: {
  initialImages: AdminProductImage[];
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );

  useEffect(
    () => () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    },
    [previews],
  );

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setNotice(null);

    const files = Array.from(event.target.files ?? []);

    const validationError = validateProductImageSelection({
      currentImageCount: images.length,
      files,
    });

    if (validationError) {
      setSelectedFiles([]);
      setError(validationError);
      event.target.value = "";
      return;
    }

    setSelectedFiles(files);
  }

  async function uploadImages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setError("Pilih minimal satu gambar untuk diunggah.");
      return;
    }

    const formData = new FormData();

    for (const file of selectedFiles) {
      formData.append("files", file);
    }

    const updatedImages = await requestImages(
      `/admin/api/products/${encodeURIComponent(productId)}/images`,
      {
        body: formData,
        method: "POST",
      },
      "upload",
    );

    if (updatedImages) {
      setSelectedFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setNotice(`${selectedFiles.length} gambar berhasil diunggah.`);
    }
  }

  async function setPrimary(imageId: string) {
    const updatedImages = await requestImages(
      `/admin/api/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}/primary`,
      { method: "PATCH" },
      `primary:${imageId}`,
    );

    if (updatedImages) {
      setNotice("Gambar utama berhasil diperbarui.");
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const reordered = moveProductImage(images, index, direction);

    if (!reordered) return;

    const updatedImages = await requestImages(
      `/admin/api/products/${encodeURIComponent(productId)}/images/order`,
      {
        body: JSON.stringify({ imageIds: reordered.map((image) => image.id) }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      },
      `order:${images[index].id}`,
    );

    if (updatedImages) {
      setNotice("Urutan gambar berhasil diperbarui.");
    }
  }

  async function deleteImage(image: AdminProductImage) {
    const confirmed = window.confirm(
      `Hapus gambar urutan ${image.sortOrder + 1} dari ${productName}? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) {
      return;
    }

    const updatedImages = await requestImages(
      `/admin/api/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(image.id)}`,
      { method: "DELETE" },
      `delete:${image.id}`,
    );

    if (updatedImages) {
      setNotice("Gambar berhasil dihapus.");
    }
  }

  async function requestImages(
    url: string,
    init: RequestInit,
    action: string,
  ): Promise<AdminProductImage[] | null> {
    setBusyAction(action);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(url, init);
      const payload = (await response.json().catch(() => null)) as {
        images?: AdminProductImage[];
        message?: string | string[];
      } | null;

      if (!response.ok || !payload?.images) {
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;
        throw new Error(message || "Pengelolaan gambar gagal. Coba lagi.");
      }

      setImages(payload.images);
      router.refresh();

      return payload.images;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pengelolaan gambar gagal. Coba lagi.",
      );
      return null;
    } finally {
      setBusyAction(null);
    }
  }

  const isBusy = busyAction !== null;

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Product Images</h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            JPEG, PNG, atau WebP. Maksimal 10 MiB per file dan{" "}
            {ADMIN_PRODUCT_IMAGE_MAX_COUNT} gambar per produk.
          </p>
        </div>
        <span className="w-fit rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted">
          {images.length}/{ADMIN_PRODUCT_IMAGE_MAX_COUNT} gambar
        </span>
      </div>

      <div aria-live="polite" className="mt-4">
        {error ? (
          <p className="rounded-[var(--radius-md)] border border-danger bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-[var(--radius-md)] border border-success bg-success-bg px-4 py-3 text-sm font-medium text-success">
            {notice}
          </p>
        ) : null}
      </div>

      <form className="mt-5" onSubmit={uploadImages}>
        <label className="block">
          <span className="text-sm font-semibold text-ink">
            Pilih gambar produk
          </span>
          <input
            accept={ADMIN_PRODUCT_IMAGE_ACCEPTED_TYPES.join(",")}
            className="mt-2 block min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-surface disabled:opacity-60"
            disabled={
              isBusy || images.length >= ADMIN_PRODUCT_IMAGE_MAX_COUNT
            }
            multiple
            onChange={handleFilesSelected}
            ref={inputRef}
            type="file"
          />
        </label>

        {previews.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map(({ file, url }) => (
              <figure
                className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-canvas"
                key={`${file.name}-${file.lastModified}`}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    alt={`Preview ${file.name}`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    src={url}
                    unoptimized
                  />
                </div>
                <figcaption className="truncate px-3 py-2 text-xs text-ink-muted">
                  {file.name}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}

        <button
          className="mt-4 min-h-11 rounded-[var(--radius-md)] bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy || selectedFiles.length === 0}
          type="submit"
        >
          {busyAction === "upload"
            ? "Mengunggah gambar..."
            : `Upload ${selectedFiles.length || ""} Gambar`}
        </button>
      </form>

      {images.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <article
              className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-canvas"
              key={image.id}
            >
              <div className="relative aspect-[3/4] bg-surface-muted">
                <Image
                  alt={image.altText}
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  src={image.url}
                />
                {image.isPrimary ? (
                  <span className="absolute left-3 top-3 rounded-md bg-ink px-2.5 py-1 text-xs font-bold text-surface">
                    PRIMARY
                  </span>
                ) : null}
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Urutan {index + 1}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">
                    {image.altText}
                  </p>
                </div>

                {!image.isPrimary ? (
                  <button
                    className="min-h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => setPrimary(image.id)}
                    type="button"
                  >
                    {busyAction === `primary:${image.id}`
                      ? "Memproses..."
                      : "Set Primary"}
                  </button>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    aria-label={`Pindahkan gambar urutan ${index + 1} ke atas`}
                    className="min-h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:opacity-40"
                    disabled={isBusy || index === 0}
                    onClick={() => moveImage(index, -1)}
                    type="button"
                  >
                    Naik
                  </button>
                  <button
                    aria-label={`Pindahkan gambar urutan ${index + 1} ke bawah`}
                    className="min-h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:opacity-40"
                    disabled={isBusy || index === images.length - 1}
                    onClick={() => moveImage(index, 1)}
                    type="button"
                  >
                    Turun
                  </button>
                </div>

                <button
                  className="min-h-10 w-full rounded-[var(--radius-md)] border border-danger bg-surface px-3 py-2 text-sm font-semibold text-danger hover:bg-danger hover:text-surface disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => deleteImage(image)}
                  type="button"
                >
                  {busyAction === `delete:${image.id}`
                    ? "Menghapus..."
                    : "Hapus Gambar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-border bg-canvas p-8 text-center">
          <h3 className="font-semibold text-ink">
            No product images uploaded yet.
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Pilih satu atau beberapa gambar di atas untuk mengisi galeri produk.
          </p>
        </div>
      )}
    </section>
  );
}
