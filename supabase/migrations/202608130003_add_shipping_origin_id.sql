ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS "originDistrictId" TEXT;
