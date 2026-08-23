import "server-only";

import { allowedCourierCodes } from "@/lib/shipping/types";

export type ShippingConfig = {
  provider: "rajaongkir-komerce";
  baseUrl: string;
  apiKey: string | null;
  originDistrictId: string | null;
  requestTimeoutMs: number;
  couriers: typeof allowedCourierCodes;
};

export function getShippingConfig(): ShippingConfig {
  return {
    provider: "rajaongkir-komerce",
    baseUrl:
      process.env.RAJAONGKIR_BASE_URL ?? "https://rajaongkir.komerce.id/api/v1",
    apiKey: process.env.RAJAONGKIR_API_KEY ?? null,
    originDistrictId: process.env.SHIPPING_ORIGIN_DISTRICT_ID ?? null,
    requestTimeoutMs: 8000,
    couriers: allowedCourierCodes,
  };
}
