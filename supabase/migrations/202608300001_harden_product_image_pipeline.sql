ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS "publicId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_images_publicid_not_blank_check'
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_publicid_not_blank_check
      CHECK ("publicId" IS NULL OR length(btrim("publicId")) > 0);
  END IF;
END $$;

-- Preserve the earliest deterministic primary when legacy data contains more
-- than one primary image for a product.
WITH ranked_primaries AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY "productId"
      ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS primary_rank
  FROM public.product_images
  WHERE "isPrimary" = true
)
UPDATE public.product_images image
SET "isPrimary" = false
FROM ranked_primaries ranked
WHERE image.id = ranked.id
  AND ranked.primary_rank > 1;

-- Rebuild deterministic contiguous ordering before installing the unique
-- per-product sort-order index. Primary images always occupy the first slot.
DROP INDEX IF EXISTS public.product_images_productId_sortOrder_key;

WITH ordered_images AS (
  SELECT
    id,
    (
      row_number() OVER (
        PARTITION BY "productId"
        ORDER BY
          "isPrimary" DESC,
          "sortOrder" ASC,
          "createdAt" ASC,
          id ASC
      ) - 1
    )::integer AS normalized_sort_order
  FROM public.product_images
)
UPDATE public.product_images image
SET "sortOrder" = ordered.normalized_sort_order
FROM ordered_images ordered
WHERE image.id = ordered.id
  AND image."sortOrder" <> ordered.normalized_sort_order;

-- Legacy products with images but no explicit primary inherit their first
-- deterministic image. Products without images remain valid.
WITH first_images AS (
  SELECT DISTINCT ON ("productId") id, "productId"
  FROM public.product_images
  ORDER BY
    "productId",
    "sortOrder" ASC,
    "createdAt" ASC,
    id ASC
)
UPDATE public.product_images image
SET "isPrimary" = true
FROM first_images first_image
WHERE image.id = first_image.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_images primary_image
    WHERE primary_image."productId" = first_image."productId"
      AND primary_image."isPrimary" = true
  );

CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary_per_product_key
  ON public.product_images ("productId")
  WHERE "isPrimary" = true;

CREATE UNIQUE INDEX IF NOT EXISTS product_images_productId_sortOrder_key
  ON public.product_images ("productId", "sortOrder");

CREATE UNIQUE INDEX IF NOT EXISTS product_images_publicId_key
  ON public.product_images ("publicId")
  WHERE "publicId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_images_read_order_idx
  ON public.product_images (
    "productId",
    "isPrimary" DESC,
    "sortOrder" ASC,
    "createdAt" ASC,
    id ASC
  );

DROP TRIGGER IF EXISTS product_images_set_updated_at ON public.product_images;

CREATE TRIGGER product_images_set_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
