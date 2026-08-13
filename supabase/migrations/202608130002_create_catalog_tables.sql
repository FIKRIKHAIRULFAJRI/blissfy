DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryId" UUID NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "normalPrice" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT products_slug_key UNIQUE (slug),
  CONSTRAINT products_categoryId_fkey
    FOREIGN KEY ("categoryId") REFERENCES public.categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT products_slug_format_check
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT products_name_not_blank_check
    CHECK (length(btrim(name)) >= 2),
  CONSTRAINT products_normalPrice_positive_check
    CHECK ("normalPrice" > 0)
);

CREATE INDEX IF NOT EXISTS products_categoryId_idx
  ON public.products ("categoryId");

CREATE INDEX IF NOT EXISTS products_isActive_idx
  ON public.products ("isActive");

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL,
  url TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT product_images_productId_fkey
    FOREIGN KEY ("productId") REFERENCES public.products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT product_images_url_not_blank_check
    CHECK (length(btrim(url)) > 0),
  CONSTRAINT product_images_sortOrder_nonnegative_check
    CHECK ("sortOrder" >= 0)
);

CREATE INDEX IF NOT EXISTS product_images_productId_idx
  ON public.product_images ("productId");

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL,
  sku TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "colorHex" TEXT,
  size TEXT NOT NULL,
  "weightGram" INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT product_variants_sku_key UNIQUE (sku),
  CONSTRAINT product_variants_productId_fkey
    FOREIGN KEY ("productId") REFERENCES public.products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT product_variants_colorName_not_blank_check
    CHECK (length(btrim("colorName")) >= 2),
  CONSTRAINT product_variants_size_not_blank_check
    CHECK (length(btrim(size)) > 0),
  CONSTRAINT product_variants_colorHex_format_check
    CHECK ("colorHex" IS NULL OR "colorHex" ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT product_variants_weightGram_positive_check
    CHECK ("weightGram" > 0),
  CONSTRAINT product_variants_stock_nonnegative_check
    CHECK (stock >= 0)
);

CREATE INDEX IF NOT EXISTS product_variants_productId_idx
  ON public.product_variants ("productId");

CREATE INDEX IF NOT EXISTS product_variants_isActive_idx
  ON public.product_variants ("isActive");

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON public.product_variants;

CREATE TRIGGER product_variants_set_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL,
  type "DiscountType" NOT NULL,
  value INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT discounts_productId_fkey
    FOREIGN KEY ("productId") REFERENCES public.products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT discounts_value_positive_check
    CHECK (value > 0),
  CONSTRAINT discounts_percentage_range_check
    CHECK (type <> 'PERCENTAGE' OR value BETWEEN 1 AND 90),
  CONSTRAINT discounts_time_range_check
    CHECK ("endsAt" > "startsAt")
);

CREATE INDEX IF NOT EXISTS discounts_productId_idx
  ON public.discounts ("productId");

CREATE INDEX IF NOT EXISTS discounts_isActive_startsAt_endsAt_idx
  ON public.discounts ("isActive", "startsAt", "endsAt");

DROP TRIGGER IF EXISTS discounts_set_updated_at ON public.discounts;

CREATE TRIGGER discounts_set_updated_at
BEFORE UPDATE ON public.discounts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeName" TEXT NOT NULL DEFAULT 'Blissfy.co',
  "originAddress" TEXT NOT NULL,
  "originVillage" TEXT,
  "originDistrict" TEXT NOT NULL,
  "originCity" TEXT NOT NULL,
  "originProvince" TEXT NOT NULL,
  "originPostalCode" TEXT NOT NULL,
  "defaultPackagingWeightGram" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT store_settings_defaultPackagingWeightGram_nonnegative_check
    CHECK ("defaultPackagingWeightGram" IS NULL OR "defaultPackagingWeightGram" >= 0)
);

DROP TRIGGER IF EXISTS store_settings_set_updated_at ON public.store_settings;

CREATE TRIGGER store_settings_set_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
