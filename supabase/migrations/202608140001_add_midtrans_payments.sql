DO $$
BEGIN
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_REVIEW';
END $$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS "providerOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentType" TEXT,
  ADD COLUMN IF NOT EXISTS "grossAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "qrImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "qrString" TEXT,
  ADD COLUMN IF NOT EXISTS "rawResponse" JSONB,
  ADD COLUMN IF NOT EXISTS "lastStatusCode" TEXT,
  ADD COLUMN IF NOT EXISTS "lastStatusMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "fraudStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "settlementTime" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_grossAmount_nonnegative_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_grossAmount_nonnegative_check
      CHECK ("grossAmount" IS NULL OR "grossAmount" >= 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS payments_providerOrderId_key
  ON public.payments ("providerOrderId")
  WHERE "providerOrderId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS payments_gatewayTransactionId_idx
  ON public.payments ("gatewayTransactionId");

CREATE INDEX IF NOT EXISTS payments_provider_status_expiresAt_idx
  ON public.payments (provider, status, "expiresAt")
  WHERE "providerOrderId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "paymentId" TEXT,
  "orderId" TEXT,
  provider TEXT NOT NULL,
  "eventHash" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "providerOrderId" TEXT,
  "gatewayTransactionId" TEXT,
  "transactionStatus" TEXT,
  "fraudStatus" TEXT,
  "statusCode" TEXT,
  "grossAmount" INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  "processingResult" TEXT,
  "processedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payment_events_eventHash_key UNIQUE ("eventHash"),
  CONSTRAINT payment_events_paymentId_fkey
    FOREIGN KEY ("paymentId") REFERENCES public.payments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT payment_events_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES public.orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT payment_events_grossAmount_nonnegative_check
    CHECK ("grossAmount" IS NULL OR "grossAmount" >= 0)
);

CREATE INDEX IF NOT EXISTS payment_events_orderId_createdAt_idx
  ON public.payment_events ("orderId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS payment_events_providerOrderId_idx
  ON public.payment_events ("providerOrderId");

CREATE INDEX IF NOT EXISTS payment_events_processedAt_idx
  ON public.payment_events ("processedAt");
