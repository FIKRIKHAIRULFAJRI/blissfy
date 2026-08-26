import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { InventoryService } from '../../inventory/application/inventory.service';
import {
  SHIPPING_PROVIDER,
  type ShippingProvider,
} from '../domain/shipping-provider';
import {
  regionQuerySchema,
  shippingRateRequestSchema,
  type ShippingRateRequestInput,
} from '../domain/shipping.schema';
import {
  allowedCourierCodes,
  ShippingProviderError,
} from '../domain/shipping.types';
import {
  scopeShippingQuotes,
  type ShippingQuotePayload,
} from '../domain/quote-contract';
import { ShippingRepository } from '../infrastructure/shipping.repository';

type ShippingCartValidation = {
  items: ShippingRateRequestInput['items'];
  totalProductWeightGrams: number;
  packagingWeightGrams: number;
  totalWeightGrams: number;
  originDistrictId: string;
};

@Injectable()
export class ShippingService {
  constructor(
    private readonly shippingRepository: ShippingRepository,
    private readonly inventoryService: InventoryService,
    private readonly configService: ConfigService,

    @Inject(SHIPPING_PROVIDER)
    private readonly shippingProvider: ShippingProvider,
  ) {}

  async getRegions(input: unknown) {
    const parsed = regionQuerySchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        ok: false,
        message: 'Parameter wilayah belum lengkap.',
        issues: z.flattenError(parsed.error).fieldErrors,
      });
    }

    try {
      const regions = await this.shippingProvider.getRegions(parsed.data);

      return {
        ok: true,
        regions,
      };
    } catch (error) {
      this.throwShippingError(
        error,
        'Shipping regions request failed',
        'Data wilayah belum dapat dimuat. Coba lagi.',
      );
    }
  }

  async getRates(body: unknown) {
    const parsed = shippingRateRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        ok: false,
        message: 'Payload cek ongkir belum lengkap.',
        issues: z.flattenError(parsed.error).fieldErrors,
      });
    }

    try {
      const shippingCart = await this.validateShippingCart(parsed.data);

      let quotes = await this.shippingProvider.getRates({
        originDistrictId: shippingCart.originDistrictId,

        destinationDistrictId: parsed.data.destinationDistrictId,

        weightGrams: shippingCart.totalWeightGrams,

        couriers: [...allowedCourierCodes],
      });

      if (quotes.length === 0) {
        throw new ShippingProviderError(
          'SHIPPING_UNSUPPORTED_LOCATION',
          'Layanan JNE atau J&T belum tersedia untuk alamat tujuan ini.',
          422,
        );
      }

      if (parsed.data.destination) {
        const quotePayload: ShippingQuotePayload = {
          destination: parsed.data.destination,

          items: shippingCart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),

          totalProductWeightGram: shippingCart.totalProductWeightGrams,

          packagingWeightGram: shippingCart.packagingWeightGrams,

          totalWeightGram: shippingCart.totalWeightGrams,
        };

        quotes = scopeShippingQuotes(quotePayload, quotes);

        await this.shippingRepository.persistShippingQuotes({
          destination: parsed.data.destination,

          items: quotePayload.items,

          originDistrictId: shippingCart.originDistrictId,

          packagingWeightGram: shippingCart.packagingWeightGrams,

          quotes,

          totalProductWeightGram: shippingCart.totalProductWeightGrams,

          totalWeightGram: shippingCart.totalWeightGrams,
        });
      }

      return {
        ok: true,
        quotes,
        totalProductWeightGrams: shippingCart.totalProductWeightGrams,
        packagingWeightGrams: shippingCart.packagingWeightGrams,
        totalWeightGrams: shippingCart.totalWeightGrams,
      };
    } catch (error) {
      this.throwShippingError(
        error,
        'Shipping rates request failed',
        'Ongkir belum dapat dihitung. Coba lagi.',
      );
    }
  }

  private async validateShippingCart(
    input: ShippingRateRequestInput,
  ): Promise<ShippingCartValidation> {
    if (input.items.length === 0) {
      throw new ShippingProviderError(
        'SHIPPING_BAD_REQUEST',
        'Keranjang masih kosong.',
        400,
      );
    }

    const variantIds = Array.from(
      new Set(input.items.map((item) => item.variantId)),
    );

    const [rows, availability] = await Promise.all([
      this.shippingRepository.findVariants(variantIds),

      this.inventoryService.getVariantAvailability(variantIds),
    ]);

    const rowsByVariant = new Map(rows.map((row) => [row.variantId, row]));

    const requestedQuantityByVariant = new Map<string, number>();

    for (const item of input.items) {
      requestedQuantityByVariant.set(
        item.variantId,
        (requestedQuantityByVariant.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    let totalProductWeightGrams = 0;

    let packagingWeightGrams = 0;

    for (const item of input.items) {
      const row = rowsByVariant.get(item.variantId);

      if (!row) {
        throw new ShippingProviderError(
          'SHIPPING_BAD_REQUEST',
          'Salah satu varian di keranjang tidak ditemukan.',
          400,
        );
      }

      if (item.productId !== row.productId) {
        throw new ShippingProviderError(
          'SHIPPING_BAD_REQUEST',
          'Data produk dan varian di keranjang tidak cocok.',
          400,
        );
      }

      if (!row.productIsActive || !row.variantIsActive) {
        throw new ShippingProviderError(
          'SHIPPING_BAD_REQUEST',
          'Salah satu produk atau varian di keranjang sudah tidak aktif.',
          400,
        );
      }

      const availableStock = availability.get(item.variantId)?.available ?? 0;

      const requestedQuantity =
        requestedQuantityByVariant.get(item.variantId) ?? item.quantity;

      if (availableStock < requestedQuantity) {
        throw new ShippingProviderError(
          'SHIPPING_BAD_REQUEST',
          'Stok salah satu varian tidak mencukupi.',
          400,
        );
      }

      if (row.weightGram <= 0) {
        throw new ShippingProviderError(
          'SHIPPING_BAD_REQUEST',
          'Berat salah satu varian belum valid.',
          400,
        );
      }

      totalProductWeightGrams += row.weightGram * item.quantity;

      if (row.packagingWeightGram !== null) {
        packagingWeightGrams = row.packagingWeightGram;
      }
    }

    const totalWeightGrams = totalProductWeightGrams + packagingWeightGrams;

    if (totalWeightGrams <= 0) {
      throw new ShippingProviderError(
        'SHIPPING_BAD_REQUEST',
        'Berat kiriman belum valid.',
        400,
      );
    }

    const originDistrictId = this.configService
      .get<string>('SHIPPING_ORIGIN_DISTRICT_ID')
      ?.trim();

    if (!originDistrictId) {
      throw new ShippingProviderError(
        'SHIPPING_NOT_CONFIGURED',
        'ID kecamatan asal pengiriman belum dikonfigurasi untuk provider ongkir.',
        503,
      );
    }

    return {
      items: input.items,
      totalProductWeightGrams,
      packagingWeightGrams,
      totalWeightGrams,
      originDistrictId,
    };
  }

  private throwShippingError(
    error: unknown,
    logMessage: string,
    fallbackMessage: string,
  ): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof ShippingProviderError) {
      throw new HttpException(
        {
          ok: false,
          code: error.code,
          message: error.message,
        },
        error.status,
      );
    }

    console.error(logMessage, {
      name: error instanceof Error ? error.name : 'UnknownError',
    });

    throw new BadGatewayException({
      ok: false,
      code: 'SHIPPING_PROVIDER_UNAVAILABLE',
      message: fallbackMessage,
    });
  }
}
