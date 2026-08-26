import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3002),

  STORE_URL: z.string().url().default('http://localhost:3000'),

  ADMIN_URL: z.string().url().default('http://localhost:3001'),

  DATABASE_URL: z.string().min(1),

  RAJAONGKIR_BASE_URL: z
    .string()
    .url()
    .default('https://rajaongkir.komerce.id/api/v1'),

  RAJAONGKIR_API_KEY: z.string().trim().min(1).optional(),

  SHIPPING_ORIGIN_DISTRICT_ID: z.string().trim().min(1).optional(),

  CRON_SECRET: z.string().trim().min(16).optional(),
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
