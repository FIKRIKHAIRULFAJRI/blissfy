import { Injectable } from '@nestjs/common';
import { InventoryService } from '../../inventory/application/inventory.service';

import {
  getPriceSnapshot,
  type DiscountForPricing,
} from '../domain/product-pricing';

import type { CatalogProduct, ProductDetail } from '../domain/product.types';

import {
  ProductsRepository,
  type DiscountRow,
  type ImageRow,
  type ProductRow,
  type VariantRow,
} from '../infrastructure/products.repository';

type ProductRelations = {
  imagesByProduct: Map<string, ImageRow[]>;
  variantsByProduct: Map<string, VariantRow[]>;
  discountsByProduct: Map<string, DiscountRow[]>;
  availableStockByVariant: Map<string, number>;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async getCatalogProducts(limit?: number): Promise<CatalogProduct[]> {
    const products = await this.productsRepository.findActiveProducts(limit);

    if (products.length === 0) {
      return [];
    }

    const relations = await this.getProductRelations(
      products.map((product) => product.id),
    );

    return products.map((product) =>
      this.mapCatalogProduct(product, relations),
    );
  }

  async getProductBySlug(slug: string): Promise<ProductDetail | null> {
    const product = await this.productsRepository.findActiveProductBySlug(slug);

    if (!product) {
      return null;
    }

    const relations = await this.getProductRelations([product.id]);

    return this.mapProductDetail(product, relations);
  }

  private async getProductRelations(
    productIds: string[],
  ): Promise<ProductRelations> {
    const [images, variants, discounts] = await Promise.all([
      this.productsRepository.findImages(productIds),
      this.productsRepository.findVariants(productIds),
      this.productsRepository.findDiscounts(productIds),
    ]);

    const availability = await this.inventoryService.getVariantAvailability(
      variants.map((variant) => variant.id),
    );

    return {
      imagesByProduct: this.groupByProductId(images),
      variantsByProduct: this.groupByProductId(variants),
      discountsByProduct: this.groupByProductId(discounts),

      availableStockByVariant: new Map(
        Array.from(availability, ([variantId, stock]) => [
          variantId,
          stock.available,
        ]),
      ),
    };
  }

  private groupByProductId<T extends { productId: string }>(
    rows: T[],
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();

    for (const row of rows) {
      const current = map.get(row.productId) ?? [];

      current.push(row);
      map.set(row.productId, current);
    }

    return map;
  }

  private mapProductDetail(
    product: ProductRow,
    relations: ProductRelations,
  ): ProductDetail {
    const images = relations.imagesByProduct.get(product.id) ?? [];
    const variants = relations.variantsByProduct.get(product.id) ?? [];

    return {
      ...this.mapCatalogProduct(product, relations),

      images: images.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.altText ?? product.name,
      })),

      variants: variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        size: variant.size,
        weightGram: variant.weightGram,

        stock: relations.availableStockByVariant.get(variant.id) ?? 0,

        isActive: variant.isActive,
      })),
    };
  }

  private mapCatalogProduct(
    product: ProductRow,
    relations: ProductRelations,
  ): CatalogProduct {
    const images = relations.imagesByProduct.get(product.id) ?? [];

    const variants = (relations.variantsByProduct.get(product.id) ?? []).filter(
      (variant) => variant.isActive,
    );

    const discounts: DiscountForPricing[] =
      relations.discountsByProduct.get(product.id) ?? [];

    const price = getPriceSnapshot(product.normalPrice, discounts);

    const image = images[0];

    const totalStock = variants.reduce(
      (sum, variant) =>
        sum + (relations.availableStockByVariant.get(variant.id) ?? 0),
      0,
    );

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryName: product.categoryName,

      normalPrice: product.normalPrice,
      salePrice: price.salePrice,
      discountLabel: price.discountLabel,

      primaryImage: {
        url: image?.url ?? '/products/placeholder-ivory.svg',
        altText: image?.altText ?? product.name,
      },

      colors: this.uniqueColors(variants),

      totalStock,
      isAvailable: totalStock > 0,
    };
  }

  private uniqueColors(variants: VariantRow[]): Array<{
    name: string;
    value: string | null;
  }> {
    const colors = new Map<string, string | null>();

    for (const variant of variants) {
      if (!colors.has(variant.colorName)) {
        colors.set(variant.colorName, variant.colorHex);
      }
    }

    return Array.from(colors, ([name, value]) => ({
      name,
      value,
    })).slice(0, 4);
  }
}
