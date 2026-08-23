import { z } from "zod";
import { checkoutFormSchema } from "@/lib/cart/schemas";

const databaseId = z.string().trim().min(1);
const orderItemRequestSchema = z.object({
  productId: databaseId,
  variantId: databaseId,
  quantity: z.coerce.number().int().min(1).max(99),
});

export const createOrderRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(16).max(120),
  items: z.array(orderItemRequestSchema).min(1).max(50),
  recipient: checkoutFormSchema.omit({
    orderNote: true,
    termsAccepted: true,
  }),
  orderNote: z.string().trim().max(500).optional(),
  shippingQuoteId: z.string().trim().min(16),
  destination: z.object({
    provinceId: databaseId,
    provinceName: z.string().trim().min(1),
    cityId: databaseId,
    cityName: z.string().trim().min(1),
    districtId: databaseId,
    districtName: z.string().trim().min(1),
  }),
  termsAccepted: z
    .boolean()
    .refine((value) => value, "Persetujuan syarat dan privasi wajib dicentang."),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
