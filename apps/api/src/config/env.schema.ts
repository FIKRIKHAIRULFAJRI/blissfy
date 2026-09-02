import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3002),

  STORE_URL: z.string().url().default('http://localhost:3000'),

  ADMIN_URL: z.string().url().default('http://localhost:3001'),

  DATABASE_URL: z.string().min(1),

  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),

  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),

  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),

  RAJAONGKIR_BASE_URL: z
    .string()
    .url()
    .default('https://rajaongkir.komerce.id/api/v1'),

  RAJAONGKIR_API_KEY: z.string().trim().min(1).optional(),

  SHIPPING_ORIGIN_DISTRICT_ID: z.string().trim().min(1).optional(),

  CRON_SECRET: z.string().trim().min(16).optional(),

  PAYMENT_GATEWAY_MODE: z.enum(['mock', 'doku']).default('mock'),

  DOKU_BASE_URL: z.string().url().default('https://api-sandbox.doku.com'),

  DOKU_CLIENT_ID: z.string().trim().min(1).optional(),

  DOKU_SECRET_KEY: z.string().trim().min(1).optional(),

  DOKU_PRIVATE_KEY_PATH: z.string().trim().min(1).optional(),

  DOKU_MERCHANT_ID: z.string().trim().min(1).optional(),

  DOKU_TERMINAL_ID: z.string().trim().min(1).max(16).optional(),

  DOKU_IS_PRODUCTION: z.enum(['true', 'false']).default('false'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
