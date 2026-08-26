import { Injectable } from '@nestjs/common';
import { InventoryService } from '../../inventory/application/inventory.service';
import {
  getActiveDiscount,
  getPriceSnapshot,
} from '../../products/domain/product-pricing';
import type { CreateOrderRequest } from '../domain/order.schema';
import {
  OrderSnapshotError,
  type OrderSnapshot,
  type OrderSnapshotItem,
  type OrderTotals,
} from '../domain/order.types';
import {
  OrderRepository,
  type OrderDiscountRow,
} from '../infrastructure/order.repository';

@Injectable()
export class OrderSnapshotService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async build(items: CreateOrderRequest['items']): Promise<OrderSnapshot> {
    const variantIds = Array.from(new Set(items.map((item) => item.variantId)));

    const [catalogRows, availabilityByVariant] = await Promise.all([
      this.orderRepository.findCatalogRows(variantIds),

      this.inventoryService.getVariantAvailability(variantIds),
    ]);

    const rowsByVariant = new Map(
      catalogRows.map((row) => [row.variantId, row]),
    );

    const productIds = Array.from(
      new Set(catalogRows.map((row) => row.productId)),
    );

    const discounts = await this.orderRepository.findDiscounts(productIds);

    const discountsByProduct = groupDiscountsByProduct(discounts);

    const requestedQuantityByVariant = new Map<string, number>();

    for (const item of items) {
      requestedQuantityByVariant.set(
        item.variantId,
        (requestedQuantityByVariant.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    const snapshotItems: OrderSnapshotItem[] = [];

    const now = new Date();

    for (const item of items) {
      const row = rowsByVariant.get(item.variantId);

      if (!row) {
        throw new OrderSnapshotError(
          'VARIANT_NOT_FOUND',
          'Varian tidak ditemukan.',
        );
      }

      if (item.productId !== row.productId) {
        throw new OrderSnapshotError(
          'VARIANT_PRODUCT_MISMATCH',
          'Data produk dan varian tidak cocok. Perbarui keranjang.',
        );
      }

      if (!row.productIsActive || !row.variantIsActive) {
        throw new OrderSnapshotError(
          'ITEM_INACTIVE',
          'Salah satu produk atau varian sudah tidak aktif.',
        );
      }

      const availability = availabilityByVariant.get(item.variantId);

      const availableStock = availability?.available ?? 0;

      const requestedQuantity =
        requestedQuantityByVariant.get(item.variantId) ?? item.quantity;

      if (availableStock < requestedQuantity) {
        throw new OrderSnapshotError(
          'STOCK_CHANGED',
          'Stok berubah. Periksa ulang keranjang sebelum membuat pesanan.',
        );
      }

      if (row.weightGram <= 0) {
        throw new OrderSnapshotError(
          'INVALID_WEIGHT',
          'Berat salah satu varian belum valid.',
        );
      }

      const productDiscounts = discountsByProduct.get(row.productId) ?? [];

      const activeDiscount = getActiveDiscount(productDiscounts, now);

      const price = getPriceSnapshot(
        row.normalPrice,
        activeDiscount ? [activeDiscount] : [],
        now,
      );

      const lineGross = row.normalPrice * item.quantity;

      const lineDiscount = price.saving * item.quantity;

      const lineNet = price.salePrice * item.quantity;

      snapshotItems.push({
        productId: row.productId,

        variantId: row.variantId,

        productName: row.productName,

        sku: row.sku,

        colorName: row.colorName,

        size: row.size,

        quantity: item.quantity,

        normalPrice: row.normalPrice,

        discountType: activeDiscount?.type ?? null,

        discountValue: activeDiscount?.value ?? null,

        discountLabel: price.discountLabel,

        salePrice: price.salePrice,

        lineGross,

        lineDiscount,

        lineNet,

        weightGram: row.weightGram,

        lineWeightGram: row.weightGram * item.quantity,
      });
    }

    const packagingWeightGram =
      catalogRows.find((row) => row.packagingWeightGram !== null)
        ?.packagingWeightGram ?? 0;

    const totals = snapshotItems.reduce<OrderTotals>(
      (current, item) => ({
        grossSubtotal: current.grossSubtotal + item.lineGross,

        discountTotal: current.discountTotal + item.lineDiscount,

        netSubtotal: current.netSubtotal + item.lineNet,

        totalProductWeightGram:
          current.totalProductWeightGram + item.lineWeightGram,

        packagingWeightGram: current.packagingWeightGram,

        totalWeightGram: current.totalWeightGram + item.lineWeightGram,
      }),
      {
        grossSubtotal: 0,
        discountTotal: 0,
        netSubtotal: 0,

        totalProductWeightGram: 0,

        packagingWeightGram,

        totalWeightGram: packagingWeightGram,
      },
    );

    return {
      items: snapshotItems,
      totals,
    };
  }
}

function groupDiscountsByProduct(discounts: OrderDiscountRow[]) {
  const result = new Map<string, OrderDiscountRow[]>();

  for (const discount of discounts) {
    const current = result.get(discount.productId) ?? [];

    current.push(discount);

    result.set(discount.productId, current);
  }

  return result;
}
