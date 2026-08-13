DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM (
      'PENDING',
      'PAID',
      'EXPIRED',
      'FAILED',
      'REFUNDED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfillmentStatus') THEN
    CREATE TYPE "FulfillmentStatus" AS ENUM (
      'WAITING_PAYMENT',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockReservationStatus') THEN
    CREATE TYPE "StockReservationStatus" AS ENUM (
      'ACTIVE',
      'RELEASED',
      'CONSUMED',
      'EXPIRED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryMovementType') THEN
    CREATE TYPE "InventoryMovementType" AS ENUM (
      'RESERVATION_CREATED',
      'RESERVATION_RELEASED',
      'SALE_CONFIRMED',
      'ADJUSTMENT'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.checkout_shipping_quotes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quoteId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "itemsHash" TEXT NOT NULL,
  "originDistrictId" TEXT NOT NULL,
  "destinationProvinceId" TEXT NOT NULL,
  "destinationProvinceName" TEXT NOT NULL,
  "destinationCityId" TEXT NOT NULL,
  "destinationCityName" TEXT NOT NULL,
  "destinationDistrictId" TEXT NOT NULL,
  "destinationDistrictName" TEXT NOT NULL,
  "courierCode" TEXT NOT NULL,
  "courierName" TEXT NOT NULL,
  "serviceCode" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "estimatedDelivery" TEXT NOT NULL,
  "shippingCost" INTEGER NOT NULL,
  "totalProductWeightGram" INTEGER NOT NULL,
  "packagingWeightGram" INTEGER NOT NULL DEFAULT 0,
  "totalWeightGram" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT checkout_shipping_quotes_quoteId_key UNIQUE ("quoteId"),
  CONSTRAINT checkout_shipping_quotes_shippingCost_nonnegative_check
    CHECK ("shippingCost" >= 0),
  CONSTRAINT checkout_shipping_quotes_totalProductWeightGram_positive_check
    CHECK ("totalProductWeightGram" > 0),
  CONSTRAINT checkout_shipping_quotes_packagingWeightGram_nonnegative_check
    CHECK ("packagingWeightGram" >= 0),
  CONSTRAINT checkout_shipping_quotes_totalWeightGram_positive_check
    CHECK ("totalWeightGram" > 0),
  CONSTRAINT checkout_shipping_quotes_courier_check
    CHECK ("courierCode" IN ('jne', 'jnt'))
);

CREATE INDEX IF NOT EXISTS checkout_shipping_quotes_payloadHash_idx
  ON public.checkout_shipping_quotes ("payloadHash");

CREATE INDEX IF NOT EXISTS checkout_shipping_quotes_expiresAt_idx
  ON public.checkout_shipping_quotes ("expiresAt");

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderNumber" TEXT NOT NULL,
  "accessTokenHash" TEXT NOT NULL,
  "idempotencyKeyHash" TEXT NOT NULL,
  "idempotencyPayloadHash" TEXT NOT NULL,
  "shippingQuoteId" TEXT NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'WAITING_PAYMENT',
  "recipientName" TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  "destinationProvinceId" TEXT NOT NULL,
  "destinationProvinceName" TEXT NOT NULL,
  "destinationCityId" TEXT NOT NULL,
  "destinationCityName" TEXT NOT NULL,
  "destinationDistrictId" TEXT NOT NULL,
  "destinationDistrictName" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  address TEXT NOT NULL,
  "orderNote" TEXT,
  "courierCode" TEXT NOT NULL,
  "courierName" TEXT NOT NULL,
  "serviceCode" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "estimatedDelivery" TEXT NOT NULL,
  "shippingCost" INTEGER NOT NULL,
  "grossSubtotal" INTEGER NOT NULL,
  "discountTotal" INTEGER NOT NULL,
  "netSubtotal" INTEGER NOT NULL,
  "totalWeightGram" INTEGER NOT NULL,
  "totalPayment" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT orders_orderNumber_key UNIQUE ("orderNumber"),
  CONSTRAINT orders_accessTokenHash_key UNIQUE ("accessTokenHash"),
  CONSTRAINT orders_idempotencyKeyHash_key UNIQUE ("idempotencyKeyHash"),
  CONSTRAINT orders_shippingQuoteId_fkey
    FOREIGN KEY ("shippingQuoteId") REFERENCES public.checkout_shipping_quotes ("quoteId")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT orders_shippingCost_nonnegative_check CHECK ("shippingCost" >= 0),
  CONSTRAINT orders_grossSubtotal_nonnegative_check CHECK ("grossSubtotal" >= 0),
  CONSTRAINT orders_discountTotal_nonnegative_check CHECK ("discountTotal" >= 0),
  CONSTRAINT orders_netSubtotal_nonnegative_check CHECK ("netSubtotal" >= 0),
  CONSTRAINT orders_totalWeightGram_positive_check CHECK ("totalWeightGram" > 0),
  CONSTRAINT orders_totalPayment_nonnegative_check CHECK ("totalPayment" >= 0),
  CONSTRAINT orders_postalCode_format_check CHECK ("postalCode" ~ '^[0-9]{5}$'),
  CONSTRAINT orders_email_not_blank_check CHECK (length(btrim(email)) > 0),
  CONSTRAINT orders_recipientName_not_blank_check CHECK (length(btrim("recipientName")) >= 2),
  CONSTRAINT orders_address_not_blank_check CHECK (length(btrim(address)) >= 10),
  CONSTRAINT orders_courier_check CHECK ("courierCode" IN ('jne', 'jnt'))
);

CREATE INDEX IF NOT EXISTS orders_paymentStatus_idx
  ON public.orders ("paymentStatus");

CREATE INDEX IF NOT EXISTS orders_fulfillmentStatus_idx
  ON public.orders ("fulfillmentStatus");

CREATE INDEX IF NOT EXISTS orders_expiresAt_idx
  ON public.orders ("expiresAt");

CREATE INDEX IF NOT EXISTS orders_createdAt_idx
  ON public.orders ("createdAt" DESC);

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "productName" TEXT NOT NULL,
  sku TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "normalPrice" INTEGER NOT NULL,
  "discountType" TEXT,
  "discountValue" INTEGER,
  "discountLabel" TEXT,
  "salePrice" INTEGER NOT NULL,
  "lineGross" INTEGER NOT NULL,
  "lineDiscount" INTEGER NOT NULL,
  "lineNet" INTEGER NOT NULL,
  "weightGram" INTEGER NOT NULL,
  "lineWeightGram" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_items_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES public.orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT order_items_productId_fkey
    FOREIGN KEY ("productId") REFERENCES public.products(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT order_items_variantId_fkey
    FOREIGN KEY ("variantId") REFERENCES public.product_variants(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT order_items_quantity_positive_check CHECK (quantity > 0),
  CONSTRAINT order_items_normalPrice_positive_check CHECK ("normalPrice" > 0),
  CONSTRAINT order_items_salePrice_positive_check CHECK ("salePrice" > 0),
  CONSTRAINT order_items_lineGross_nonnegative_check CHECK ("lineGross" >= 0),
  CONSTRAINT order_items_lineDiscount_nonnegative_check CHECK ("lineDiscount" >= 0),
  CONSTRAINT order_items_lineNet_nonnegative_check CHECK ("lineNet" >= 0),
  CONSTRAINT order_items_weightGram_positive_check CHECK ("weightGram" > 0),
  CONSTRAINT order_items_lineWeightGram_positive_check CHECK ("lineWeightGram" > 0),
  CONSTRAINT order_items_discountValue_nonnegative_check
    CHECK ("discountValue" IS NULL OR "discountValue" >= 0),
  CONSTRAINT order_items_discountType_check
    CHECK ("discountType" IS NULL OR "discountType" IN ('PERCENTAGE', 'FIXED_AMOUNT'))
);

CREATE INDEX IF NOT EXISTS order_items_orderId_idx
  ON public.order_items ("orderId");

CREATE INDEX IF NOT EXISTS order_items_variantId_idx
  ON public.order_items ("variantId");

CREATE TABLE IF NOT EXISTS public.shipments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "courierCode" TEXT NOT NULL,
  "courierName" TEXT NOT NULL,
  "serviceCode" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "estimatedDelivery" TEXT NOT NULL,
  "shippingCost" INTEGER NOT NULL,
  "trackingNumber" TEXT,
  "shippedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT shipments_orderId_key UNIQUE ("orderId"),
  CONSTRAINT shipments_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES public.orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT shipments_shippingCost_nonnegative_check CHECK ("shippingCost" >= 0),
  CONSTRAINT shipments_courier_check CHECK ("courierCode" IN ('jne', 'jnt'))
);

DROP TRIGGER IF EXISTS shipments_set_updated_at ON public.shipments;

CREATE TRIGGER shipments_set_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  amount INTEGER NOT NULL,
  provider TEXT,
  "gatewayTransactionId" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payments_orderId_key UNIQUE ("orderId"),
  CONSTRAINT payments_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES public.orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT payments_amount_nonnegative_check CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS payments_status_idx
  ON public.payments (status);

CREATE INDEX IF NOT EXISTS payments_expiresAt_idx
  ON public.payments ("expiresAt");

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "releasedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_reservations_orderId_variantId_key UNIQUE ("orderId", "variantId"),
  CONSTRAINT stock_reservations_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES public.orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT stock_reservations_variantId_fkey
    FOREIGN KEY ("variantId") REFERENCES public.product_variants(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT stock_reservations_quantity_positive_check CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS stock_reservations_variant_active_idx
  ON public.stock_reservations ("variantId", "expiresAt")
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS stock_reservations_orderId_idx
  ON public.stock_reservations ("orderId");

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "variantId" TEXT,
  "orderId" TEXT,
  "reservationId" TEXT,
  type "InventoryMovementType" NOT NULL,
  "quantityDelta" INTEGER NOT NULL,
  note TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT inventory_movements_variantId_fkey
    FOREIGN KEY ("variantId") REFERENCES public.product_variants(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT inventory_movements_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES public.orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT inventory_movements_reservationId_fkey
    FOREIGN KEY ("reservationId") REFERENCES public.stock_reservations(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT inventory_movements_quantityDelta_not_zero_check CHECK ("quantityDelta" <> 0)
);

CREATE INDEX IF NOT EXISTS inventory_movements_variantId_createdAt_idx
  ON public.inventory_movements ("variantId", "createdAt" DESC);

CREATE OR REPLACE FUNCTION public.release_expired_stock_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.stock_reservations
    SET
      status = 'EXPIRED',
      "releasedAt" = COALESCE("releasedAt", NOW())
    WHERE status = 'ACTIVE'
      AND "expiresAt" <= NOW()
    RETURNING id, "variantId", "orderId", quantity
  ),
  movement AS (
    INSERT INTO public.inventory_movements (
      "variantId",
      "orderId",
      "reservationId",
      type,
      "quantityDelta",
      note
    )
    SELECT
      "variantId",
      "orderId",
      id,
      'RESERVATION_RELEASED',
      quantity,
      'Reservasi stok checkout kedaluwarsa'
    FROM expired
    RETURNING id
  )
  SELECT count(*)::int INTO affected_count
  FROM expired;

  RETURN affected_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.available_variant_stock(p_variant_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT GREATEST(
    0,
    COALESCE(v.stock, 0) - COALESCE((
      SELECT SUM(r.quantity)
      FROM public.stock_reservations r
      WHERE r."variantId" = v.id
        AND r.status = 'ACTIVE'
        AND r."expiresAt" > NOW()
    ), 0)
  )
  FROM public.product_variants v
  WHERE v.id = p_variant_id;
$$;
