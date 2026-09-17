/**
 * Product module contracts
 */

import type { DiscountType } from '../common';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  colorName: string;
  colorHex: string | null;
  size: string;
  weightGram: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductDiscount {
  id: string;
  productId: string;
  type: DiscountType;
  value: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  material: string | null;
  fit: string | null;
  pattern: string | null;
  careInstruction: string | null;
  sizeGuide: string | null;
  normalPrice: number;
  soldCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithRelations extends Product {
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  discount: ProductDiscount | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types

export interface GetProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateProductRequest {
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  material?: string;
  fit?: string;
  pattern?: string;
  careInstruction?: string;
  sizeGuide?: string;
  normalPrice: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  categoryId?: string;
  slug?: string;
  name?: string;
  description?: string;
  material?: string;
  fit?: string;
  pattern?: string;
  careInstruction?: string;
  sizeGuide?: string;
  normalPrice?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
}

export interface CreateVariantRequest {
  sku: string;
  colorName: string;
  colorHex?: string;
  size: string;
  weightGram: number;
  stock: number;
  isActive?: boolean;
}

export interface UpdateVariantRequest {
  sku?: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  weightGram?: number;
  stock?: number;
  isActive?: boolean;
}
