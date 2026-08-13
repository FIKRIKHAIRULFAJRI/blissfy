import "server-only";

import { getShippingConfig } from "@/lib/shipping/config";
import { createRajaOngkirProvider } from "@/lib/shipping/rajaongkir-provider";

export function getShippingProvider() {
  return createRajaOngkirProvider(getShippingConfig());
}
