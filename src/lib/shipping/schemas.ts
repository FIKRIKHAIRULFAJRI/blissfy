import { z } from "zod";
import { cartValidationItemSchema } from "@/lib/cart/schemas";

const databaseId = z.string().trim().min(1);
const regionName = z.string().trim().min(1);

export const regionQuerySchema = z.discriminatedUnion("level", [
  z.object({
    level: z.literal("province"),
  }),
  z.object({
    level: z.literal("city"),
    parentId: databaseId,
  }),
  z.object({
    level: z.literal("district"),
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
  items: z.array(cartValidationItemSchema).min(1).max(50),
});

export type RegionQueryInput = z.infer<typeof regionQuerySchema>;
export type ShippingRateRequestInput = z.infer<
  typeof shippingRateRequestSchema
>;
