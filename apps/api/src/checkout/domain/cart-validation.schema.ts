import { z } from 'zod';

const databaseId = z.string().trim().min(1);

export const cartValidationItemSchema = z.object({
  productId: databaseId,
  variantId: databaseId,
  quantity: z.coerce.number().int().min(1).max(99),
  normalPrice: z.coerce.number().int().nonnegative().optional(),
  salePrice: z.coerce.number().int().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
});

export const cartValidationSchema = z.object({
  items: z.array(z.unknown()).max(50),
});

export type CartValidationItemInput = z.infer<typeof cartValidationItemSchema>;
