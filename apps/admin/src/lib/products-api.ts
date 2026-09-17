/**
 * Product API client for Admin
 */

import { apiClient } from './api-client';
import type {
  Product,
  ProductWithRelations,
  GetProductsQuery,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
} from '@blissfy/contracts/products';

export class ProductsApi {
  async getProducts(query?: GetProductsQuery) {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.search) params.append('q', query.search);
    if (query?.isActive !== undefined) {
      params.append('status', query.isActive ? 'active' : 'inactive');
    }

    const url = `/v1/admin/products${params.toString() ? '?' + params : ''}`;
    return apiClient.get<{ products: Product[]; total: number }>(url);
  }

  async getProduct(id: string) {
    return apiClient.get<ProductWithRelations>(`/v1/admin/products/${id}`);
  }

  async createProduct(data: CreateProductRequest) {
    return apiClient.post<{ product: Product }>('/v1/admin/products', data);
  }

  async updateProduct(id: string, data: UpdateProductRequest) {
    return apiClient.patch<{ product: Product }>(
      `/v1/admin/products/${id}`,
      data,
    );
  }

  async updateProductStatus(id: string, isActive: boolean) {
    return apiClient.patch<{ product: Product }>(
      `/v1/admin/products/${id}/status`,
      { isActive },
    );
  }

  async deleteProduct(id: string) {
    return apiClient.delete<void>(`/v1/admin/products/${id}`);
  }
}

export class CategoriesApi {
  async getCategories() {
    return apiClient.get<{ categories: Category[] }>('/v1/admin/categories');
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  }) {
    return apiClient.post<{ category: Category }>(
      '/v1/admin/categories',
      data,
    );
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return apiClient.patch<{ category: Category }>(
      `/v1/admin/categories/${id}`,
      data,
    );
  }

  async deleteCategory(id: string) {
    return apiClient.delete<void>(`/v1/admin/categories/${id}`);
  }
}

export const productsApi = new ProductsApi();
export const categoriesApi = new CategoriesApi();
