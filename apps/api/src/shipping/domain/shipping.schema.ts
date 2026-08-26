import { z } from 'zod';

const databaseId = z.string().trim().min(1);
const regionName = z.string().trim().min(1);

const shippingCartItemSchema = z.object({
  productId: databaseId,
  variantId: databaseId,
  quantity: z.coerce.number().int().min(1).max(99),

  // Snapshot browser tetap diterima untuk compatibility,
  // tetapi tidak digunakan sebagai source of truth.
  normalPrice: z.coerce.number().int().nonnegative().optional(),

  salePrice: z.coerce.number().int().nonnegative().optional(),

  stock: z.coerce.number().int().nonnegative().optional(),
});

export const regionQuerySchema = z.discriminatedUnion('level', [
  z.object({
    level: z.literal('province'),
  }),

  z.object({
    level: z.literal('city'),
    parentId: databaseId,
  }),

  z.object({
    level: z.literal('district'),
    parentId: databaseId,
  }),
]);

export const shippingRateRequestSchema = z.object({
  destinationDistrictId: databaseId,

  destination: z
    .object({
      provinceId: databaseId,
      provinceName: regionName,
      cityId: databaseId,
      cityName: regionName,
      districtId: databaseId,
      districtName: regionName,
    })
    .optional(),

  items: z.array(shippingCartItemSchema).min(1).max(50),
});

export type RegionQueryInput = z.infer<typeof regionQuerySchema>;

export type ShippingRateRequestInput = z.infer<
  typeof shippingRateRequestSchema
>;
