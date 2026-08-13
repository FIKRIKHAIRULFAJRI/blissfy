import "server-only";

import crypto from "node:crypto";
import { z } from "zod";
import type {
  AllowedCourierCode,
  RegionLevel,
  ShippingProvider,
  ShippingRateQuote,
  ShippingRegion,
} from "@/lib/shipping/types";
import { ShippingProviderError } from "@/lib/shipping/types";
import type { ShippingConfig } from "@/lib/shipping/config";

const regionItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    zip_code: z.union([z.string(), z.number()]).nullish(),
  })
  .passthrough();

const regionResponseSchema = z.object({
  data: z.array(regionItemSchema),
});

const costItemSchema = z
  .object({
    code: z.string().optional(),
    name: z.string().optional(),
    service: z.string().optional(),
    description: z.string().optional(),
    cost: z.union([z.string(), z.number()]).optional(),
    value: z.union([z.string(), z.number()]).optional(),
    etd: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const costResponseSchema = z.object({
  data: z.array(costItemSchema),
});

const levelPath: Record<RegionLevel, (parentId?: string) => string> = {
  province: () => "destination/province",
  city: (parentId) => `destination/city/${encodeURIComponent(parentId ?? "")}`,
  district: (parentId) =>
    `destination/district/${encodeURIComponent(parentId ?? "")}`,
};

export function createRajaOngkirProvider(
  config: ShippingConfig,
): ShippingProvider {
  return {
    isConfigured() {
      return Boolean(config.apiKey);
    },
    async getRegions({ level, parentId }) {
      ensureConfigured(config);

      if (level !== "province" && !parentId) {
        throw new ShippingProviderError({
          code: "SHIPPING_BAD_REQUEST",
          message: "Pilihan wilayah induk belum lengkap.",
          status: 400,
        });
      }

      const response = await fetchProvider(
        config,
        levelPath[level](parentId),
        { method: "GET" },
      );
      const parsed = regionResponseSchema.safeParse(response);

      if (!parsed.success) {
        throw invalidResponseError();
      }

      return parsed.data.data.map((region): ShippingRegion => ({
        id: String(region.id),
        name: region.name,
        postalCode:
          region.zip_code === null || region.zip_code === undefined
            ? null
            : String(region.zip_code),
      }));
    },
    async getRates({
      couriers,
      destinationDistrictId,
      originDistrictId,
      weightGrams,
    }) {
      ensureConfigured(config);

      const body = new URLSearchParams({
        origin: originDistrictId,
        destination: destinationDistrictId,
        weight: String(weightGrams),
        courier: couriers.join(":"),
        price: "lowest",
      });
      const response = await fetchProvider(
        config,
        "calculate/district/domestic-cost",
        {
          body,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        },
      );
      const parsed = costResponseSchema.safeParse(response);

      if (!parsed.success) {
        throw invalidResponseError();
      }

      return parsed.data.data
        .map((item) =>
          normalizeQuote({
            destinationDistrictId,
            item,
            totalWeightGrams: weightGrams,
          }),
        )
        .filter((quote): quote is ShippingRateQuote => Boolean(quote))
        .filter((quote) => couriers.includes(quote.courierCode));
    },
  };
}

async function fetchProvider(
  config: ShippingConfig,
  path: string,
  init: RequestInit,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(
      `${config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
      {
        ...init,
        headers: {
          key: config.apiKey ?? "",
          ...init.headers,
        },
        signal: controller.signal,
      },
    );

    if (response.status === 429) {
      throw new ShippingProviderError({
        code: "SHIPPING_PROVIDER_UNAVAILABLE",
        message: "Layanan ongkir sedang membatasi request. Coba lagi nanti.",
        status: 429,
      });
    }

    if (!response.ok) {
      throw new ShippingProviderError({
        code: "SHIPPING_PROVIDER_UNAVAILABLE",
        message: "Layanan ongkir belum dapat dihubungi. Coba lagi.",
        status: 502,
      });
    }

    return response.json();
  } catch (error) {
    if (error instanceof ShippingProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ShippingProviderError({
        code: "SHIPPING_TIMEOUT",
        message: "Permintaan ongkir melewati batas waktu. Coba lagi.",
        status: 504,
      });
    }

    throw new ShippingProviderError({
      code: "SHIPPING_PROVIDER_UNAVAILABLE",
      message: "Layanan ongkir belum tersedia. Coba lagi.",
      status: 502,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeQuote({
  destinationDistrictId,
  item,
  totalWeightGrams,
}: {
  destinationDistrictId: string;
  item: z.infer<typeof costItemSchema>;
  totalWeightGrams: number;
}) {
  const courierCode = item.code?.toLowerCase();

  if (courierCode !== "jne" && courierCode !== "jnt") {
    return null;
  }

  const serviceCode = item.service ?? item.description;
  const rawCost = item.cost ?? item.value;
  const cost = Number(rawCost);

  if (!serviceCode || !Number.isInteger(cost) || cost < 0) {
    return null;
  }

  const quoteSource = [
    courierCode,
    serviceCode,
    cost,
    item.etd ?? "",
    destinationDistrictId,
    totalWeightGrams,
  ].join("|");

  return {
    quoteId: crypto.createHash("sha256").update(quoteSource).digest("hex"),
    courierCode: courierCode as AllowedCourierCode,
    courierName: item.name ?? courierCode.toUpperCase(),
    serviceCode,
    serviceName: item.description ?? serviceCode,
    cost,
    estimatedDelivery:
      item.etd === undefined || item.etd === null ? "-" : String(item.etd),
    destinationId: destinationDistrictId,
    totalWeightGrams,
  } satisfies ShippingRateQuote;
}

function ensureConfigured(config: ShippingConfig) {
  if (!config.apiKey) {
    throw new ShippingProviderError({
      code: "SHIPPING_NOT_CONFIGURED",
      message:
        "Integrasi ongkir belum dikonfigurasi. Tambahkan API key RajaOngkir/Komerce di server.",
      status: 503,
    });
  }
}

function invalidResponseError() {
  return new ShippingProviderError({
    code: "SHIPPING_PROVIDER_INVALID_RESPONSE",
    message: "Response layanan ongkir tidak sesuai format yang diharapkan.",
    status: 502,
  });
}
