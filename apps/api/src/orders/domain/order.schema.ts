import { z } from 'zod';

const databaseId = z.string().trim().min(1);

const orderItemRequestSchema = z.object({
  productId: databaseId,
  variantId: databaseId,
  quantity: z.coerce.number().int().min(1).max(99),
});

const recipientSchema = z.object({
  recipientName: z.string().trim().min(2, 'Nama penerima wajib diisi.'),

  whatsapp: z
    .string()
    .trim()
    .min(9, 'Nomor WhatsApp wajib diisi.')
    .refine((value) => {
      const normalized = value.replace(/[\s.-]/g, '');

      return /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(normalized);
    }, 'Gunakan nomor WhatsApp Indonesia yang valid.'),

  email: z.string().trim().email('Email wajib valid.'),

  province: databaseId,

  city: databaseId,

  district: databaseId,

  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit.'),

  address: z.string().trim().min(10, 'Alamat lengkap terlalu singkat.'),
});

const destinationSchema = z.object({
  provinceId: databaseId,
  provinceName: z.string().trim().min(1),

  cityId: databaseId,
  cityName: z.string().trim().min(1),

  districtId: databaseId,
  districtName: z.string().trim().min(1),
});

export const createOrderRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(16).max(120),

  items: z.array(orderItemRequestSchema).min(1).max(50),

  recipient: recipientSchema,

  orderNote: z.string().trim().max(500).optional(),

  shippingQuoteId: z.string().trim().min(16),

  destination: destinationSchema,

  termsAccepted: z
    .boolean()
    .refine(
      (value) => value,
      'Persetujuan syarat dan privasi wajib dicentang.',
    ),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export type OrderRequestItem = CreateOrderRequest['items'][number];
