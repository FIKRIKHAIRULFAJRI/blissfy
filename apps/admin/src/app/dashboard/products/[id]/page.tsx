'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { productsApi, categoriesApi } from '@/lib/products-api';
import type { Category, ProductWithRelations } from '@blissfy/contracts/products';

type FormData = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  normalPrice: number;
  isActive: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productData, categoriesData] = await Promise.all([
        productsApi.getProduct(productId),
        categoriesApi.getCategories(),
      ]);

      setCategories(categoriesData.categories);
      reset({
        categoryId: productData.categoryId,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        normalPrice: productData.normalPrice,
        isActive: productData.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      setError(null);
      await productsApi.updateProduct(productId, data);
      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow p-6 space-y-6"
      >
        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category *
          </label>
          <select
            id="categoryId"
            {...register('categoryId', { required: 'Category is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Name *
          </label>
          <input
            id="name"
            type="text"
            {...register('name', {
              required: 'Product name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
              maxLength: {
                value: 120,
                message: 'Name must not exceed 120 characters',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Slug *
          </label>
          <input
            id="slug"
            type="text"
            {...register('slug', {
              required: 'Slug is required',
              pattern: {
                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug must be lowercase with hyphens only',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description *
          </label>
          <textarea
            id="description"
            rows={6}
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 10,
                message: 'Description must be at least 10 characters',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="normalPrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price (Rp) *
          </label>
          <input
            id="normalPrice"
            type="number"
            min="1"
            step="1000"
            {...register('normalPrice', {
              required: 'Price is required',
              min: { value: 1, message: 'Price must be at least Rp 1' },
              valueAsNumber: true,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.normalPrice && (
            <p className="mt-1 text-sm text-red-600">
              {errors.normalPrice.message}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Active (visible in store)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
