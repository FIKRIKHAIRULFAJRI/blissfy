import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { ShippingProvider } from '../domain/shipping-provider';
import {
  ShippingProviderError,
  type AllowedCourierCode,
  type RegionLevel,
  type ShippingRateQuote,
  type ShippingRegion,
} from '../domain/shipping.types';

const DEFAULT_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

const REQUEST_TIMEOUT_MS = 8000;

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
  province: () => 'destination/province',

  city: (parentId) => `destination/city/${encodeURIComponent(parentId ?? '')}`,

  district: (parentId) =>
    `destination/district/${encodeURIComponent(parentId ?? '')}`,
};

@Injectable()
export class RajaOngkirProvider implements ShippingProvider {
  constructor(private readonly configService: ConfigService) {}

  async getRegions({
    level,
    parentId,
  }: {
    level: RegionLevel;
    parentId?: string;
  }): Promise<ShippingRegion[]> {
    this.ensureConfigured();

    if (level !== 'province' && !parentId) {
      throw new ShippingProviderError(
        'SHIPPING_BAD_REQUEST',
        'Pilihan wilayah induk belum lengkap.',
        400,
      );
    }

    const response = await this.fetchProvider(levelPath[level](parentId), {
      method: 'GET',
    });

    const parsed = regionResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw this.invalidResponseError();
    }

    return parsed.data.data.map((region): ShippingRegion => ({
      id: String(region.id),
      name: region.name,
      postalCode:
        region.zip_code === null || region.zip_code === undefined
          ? null
          : String(region.zip_code),
    }));
  }

  async getRates({
    couriers,
    destinationDistrictId,
    originDistrictId,
    weightGrams,
  }: {
    originDistrictId: string;
    destinationDistrictId: string;
    weightGrams: number;
    couriers: AllowedCourierCode[];
  }): Promise<ShippingRateQuote[]> {
    this.ensureConfigured();

    const body = new URLSearchParams({
      origin: originDistrictId,
      destination: destinationDistrictId,
      weight: String(weightGrams),
      courier: couriers.join(':'),
      price: 'lowest',
    });

    const response = await this.fetchProvider(
      'calculate/district/domestic-cost',
      {
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      },
    );

    const parsed = costResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw this.invalidResponseError();
    }

    return parsed.data.data
      .map((item) =>
        this.normalizeQuote({
          destinationDistrictId,
          item,
          totalWeightGrams: weightGrams,
        }),
      )
      .filter((quote): quote is ShippingRateQuote => Boolean(quote))
      .filter((quote) => couriers.includes(quote.courierCode));
  }

  private async fetchProvider(
    path: string,
    init: RequestInit,
  ): Promise<unknown> {
    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const baseUrl =
        this.configService.get<string>('RAJAONGKIR_BASE_URL') ??
        DEFAULT_BASE_URL;

      const apiKey = this.configService.get<string>('RAJAONGKIR_API_KEY') ?? '';

      const response = await fetch(
        `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        {
          ...init,
          headers: {
            key: apiKey,
            ...init.headers,
          },
          signal: controller.signal,
        },
      );

      if (response.status === 429) {
        throw new ShippingProviderError(
          'SHIPPING_PROVIDER_UNAVAILABLE',
          'Layanan ongkir sedang membatasi request. Coba lagi nanti.',
          429,
        );
      }

      if (!response.ok) {
        throw new ShippingProviderError(
          'SHIPPING_PROVIDER_UNAVAILABLE',
          'Layanan ongkir belum dapat dihubungi. Coba lagi.',
          502,
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ShippingProviderError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ShippingProviderError(
          'SHIPPING_TIMEOUT',
          'Permintaan ongkir melewati batas waktu. Coba lagi.',
          504,
        );
      }

      throw new ShippingProviderError(
        'SHIPPING_PROVIDER_UNAVAILABLE',
        'Layanan ongkir belum tersedia. Coba lagi.',
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeQuote({
    destinationDistrictId,
    item,
    totalWeightGrams,
  }: {
    destinationDistrictId: string;
    item: z.infer<typeof costItemSchema>;
    totalWeightGrams: number;
  }): ShippingRateQuote | null {
    const courierCode = item.code?.toLowerCase();

    if (courierCode !== 'jne' && courierCode !== 'jnt') {
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
      item.etd ?? '',
      destinationDistrictId,
      totalWeightGrams,
    ].join('|');

    return {
      quoteId: createHash('sha256').update(quoteSource).digest('hex'),

      courierCode: courierCode,

      courierName: item.name ?? courierCode.toUpperCase(),

      serviceCode,

      serviceName: item.description ?? serviceCode,

      cost,

      estimatedDelivery:
        item.etd === undefined || item.etd === null ? '-' : String(item.etd),

      destinationId: destinationDistrictId,

      totalWeightGrams,
    };
  }

  private ensureConfigured(): void {
    const apiKey = this.configService.get<string>('RAJAONGKIR_API_KEY');

    if (!apiKey) {
      throw new ShippingProviderError(
        'SHIPPING_NOT_CONFIGURED',
        'Integrasi ongkir belum dikonfigurasi. Tambahkan API key RajaOngkir/Komerce di server.',
        503,
      );
    }
  }

  private invalidResponseError() {
    return new ShippingProviderError(
      'SHIPPING_PROVIDER_INVALID_RESPONSE',
      'Response layanan ongkir tidak sesuai format yang diharapkan.',
      502,
    );
  }
}
