import { z } from "zod";

const optionalText = z.string().trim().optional();
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

export const checkoutFormSchema = z.object({
  recipientName: z.string().trim().min(2, "Nama penerima wajib diisi."),
  whatsapp: z
    .string()
    .trim()
    .min(9, "Nomor WhatsApp wajib diisi.")
    .refine((value) => {
      const normalized = value.replace(/[\s.-]/g, "");
      return /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(normalized);
    }, "Gunakan nomor WhatsApp Indonesia yang valid."),
  email: z.string().trim().email("Email wajib valid."),
  province: z.string().trim().min(2, "Provinsi wajib diisi."),
  city: z.string().trim().min(2, "Kota atau kabupaten wajib diisi."),
  district: z.string().trim().min(2, "Kecamatan wajib diisi."),
  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit."),
  address: z.string().trim().min(10, "Alamat lengkap terlalu singkat."),
  village: optionalText,
  addressNote: optionalText,
  orderNote: optionalText,
  termsAccepted: z
    .boolean()
    .refine((value) => value, "Persetujuan syarat dan privasi wajib dicentang."),
});

export type CartValidationInput = z.infer<typeof cartValidationSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
