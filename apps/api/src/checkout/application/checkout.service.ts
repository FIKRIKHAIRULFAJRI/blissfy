import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import { InventoryService } from '../../inventory/application/inventory.service';
import { getPriceSnapshot } from '../../products/domain/product-pricing';
import {
  cartValidationItemSchema,
  cartValidationSchema,
  type CartValidationItemInput,
} from '../domain/cart-validation.schema';
import type {
  CartValidationNotice,
  CartValidationResponse,
  CartValidationSummary,
  InvalidCartItem,
  ValidatedCartItem,
} from '../domain/cart-validation.types';
import {
  CheckoutRepository,
  type CheckoutDiscountRow,
} from '../infrastructure/checkout.repository';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async validateCart(body: unknown): Promise<CartValidationResponse> {
    const parsed = cartValidationSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        ok: false,
        message: 'Payload keranjang tidak valid.',
        issues: z.flattenError(parsed.error).fieldErrors,
      });
    }

    if (parsed.data.items.length === 0) {
      return {
        ok: true,
        items: [],
        invalidItems: [],
        notices: [],
        summary: this.createEmptySummary(),
      };
    }

    const invalidItems: InvalidCartItem[] = [];
    const validRequestedItems: CartValidationItemInput[] = [];

    for (const [index, item] of parsed.data.items.entries()) {
      const parsedItem = cartValidationItemSchema.safeParse(item);

      if (parsedItem.success) {
        validRequestedItems.push(parsedItem.data);
        continue;
      }

      const rawItem =
        item && typeof item === 'object'
          ? (item as Record<string, unknown>)
          : undefined;

      const variantId =
        typeof rawItem?.variantId === 'string' && rawItem.variantId.trim()
          ? rawItem.variantId
          : `stale-item-${index}`;

      const productId =
        typeof rawItem?.productId === 'string' ? rawItem.productId : undefined;

      const name = typeof rawItem?.name === 'string' ? rawItem.name : undefined;

      const invalidItem: InvalidCartItem = {
        variantId,
        reason:
          'Item keranjang tersimpan memakai format lama. Hapus item ini lalu tambahkan ulang dari halaman produk.',
        stock: 0,
      };

      if (productId) {
        invalidItem.productId = productId;
      }

      if (name) {
        invalidItem.name = name;
      }

      invalidItems.push(invalidItem);
    }

    if (validRequestedItems.length === 0) {
      return {
        ok: true,
        items: [],
        invalidItems,
        notices: [],
        summary: this.createEmptySummary(),
      };
    }

    const variantIds = Array.from(
      new Set(validRequestedItems.map((item) => item.variantId)),
    );

    let variantRows;
    let availability;
    let discountsByProduct = new Map<string, CheckoutDiscountRow[]>();

    try {
      [variantRows, availability] = await Promise.all([
        this.checkoutRepository.findVariants(variantIds),

        this.inventoryService.getVariantAvailability(variantIds),
      ]);

      const productIds = Array.from(
        new Set(variantRows.map((row) => row.productId)),
      );

      const discounts = await this.checkoutRepository.findDiscounts(productIds);

      discountsByProduct = this.groupDiscountsByProduct(discounts);
    } catch (error) {
      console.error('Checkout cart validation database query failed', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });

      throw new ServiceUnavailableException({
        ok: false,
        message:
          'Keranjang belum dapat divalidasi karena database belum tersedia. Coba lagi.',
      });
    }

    const rowsByVariant = new Map(
      variantRows.map((row) => [row.variantId, row]),
    );

    const validItems: ValidatedCartItem[] = [];
    const notices: CartValidationNotice[] = [];

    for (const item of validRequestedItems) {
      const row = rowsByVariant.get(item.variantId);

      if (!row) {
        invalidItems.push({
          variantId: item.variantId,
          reason: 'Varian tidak ditemukan atau sudah dihapus.',
          stock: 0,
        });

        continue;
      }

      const availableStock = availability.get(item.variantId)?.available ?? 0;

      if (item.productId !== row.productId) {
        invalidItems.push({
          variantId: item.variantId,
          productId: item.productId,
          name: row.name,
          reason:
            'Data produk dan varian di keranjang tidak cocok. Hapus item ini lalu tambahkan ulang.',
          stock: availableStock,
        });

        continue;
      }

      if (!row.productIsActive || !row.variantIsActive || availableStock <= 0) {
        invalidItems.push({
          variantId: item.variantId,
          productId: row.productId,
          name: row.name,
          reason: !row.productIsActive
            ? 'Produk tidak aktif.'
            : !row.variantIsActive
              ? 'Varian tidak aktif.'
              : 'Stok varian habis.',
          stock: availableStock,
        });

        continue;
      }

      const discounts = discountsByProduct.get(row.productId) ?? [];

      const price = getPriceSnapshot(row.normalPrice, discounts);

      const quantity = Math.min(item.quantity, availableStock);

      if (
        item.normalPrice !== undefined &&
        item.normalPrice !== row.normalPrice
      ) {
        notices.push({
          variantId: item.variantId,
          type: 'price_changed',
          message: `Harga normal ${row.name} diperbarui dari database.`,
        });
      }

      if (item.salePrice !== undefined && item.salePrice !== price.salePrice) {
        notices.push({
          variantId: item.variantId,
          type: 'price_changed',
          message: `Harga akhir ${row.name} diperbarui dari database.`,
        });
      }

      if (item.stock !== undefined && item.stock !== availableStock) {
        notices.push({
          variantId: item.variantId,
          type: 'stock_changed',
          message: `Stok ${row.name} varian ${row.colorName}/${row.size} berubah menjadi ${availableStock}.`,
        });
      }

      if (quantity !== item.quantity) {
        notices.push({
          variantId: item.variantId,
          type: 'quantity_adjusted',
          message: `Jumlah ${row.name} disesuaikan ke stok tersedia.`,
        });
      }

      validItems.push({
        productId: row.productId,
        variantId: row.variantId,
        slug: row.slug,
        name: row.name,

        imageUrl: row.imageUrl ?? '/products/placeholder-ivory.svg',

        imageAlt: row.imageAlt ?? row.name,

        colorName: row.colorName,
        colorHex: row.colorHex,
        size: row.size,

        quantity,

        normalPrice: row.normalPrice,
        salePrice: price.salePrice,
        discountLabel: price.discountLabel,

        weightGram: row.weightGram,
        stock: availableStock,
        sku: row.sku,

        lineGross: row.normalPrice * quantity,

        lineDiscount: price.saving * quantity,

        lineNet: price.salePrice * quantity,

        lineWeightGram: row.weightGram * quantity,
      });
    }

    const summary = validItems.reduce((totals, item) => {
      totals.grossSubtotal += item.lineGross;
      totals.discountTotal += item.lineDiscount;
      totals.netSubtotal += item.lineNet;
      totals.totalItems += item.quantity;
      totals.totalWeightGram += item.lineWeightGram;

      return totals;
    }, this.createEmptySummary());

    summary.allValid = validItems.length > 0 && invalidItems.length === 0;

    return {
      ok: true,
      items: validItems,
      invalidItems,
      notices,
      summary,
    };
  }

  private createEmptySummary(): CartValidationSummary {
    return {
      grossSubtotal: 0,
      discountTotal: 0,
      netSubtotal: 0,
      totalItems: 0,
      totalWeightGram: 0,
      allValid: false,
    };
  }

  private groupDiscountsByProduct(
    rows: CheckoutDiscountRow[],
  ): Map<string, CheckoutDiscountRow[]> {
    const result = new Map<string, CheckoutDiscountRow[]>();

    for (const row of rows) {
      const discounts = result.get(row.productId) ?? [];

      discounts.push(row);

      result.set(row.productId, discounts);
    }

    return result;
  }
}
