'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { productsApi, categoriesApi } from '@/lib/products-api';
import { ImageUploader } from '@/components/ImageUploader';
import type { Category } from '@blissfy/contracts/products';

type FormData = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  material: string;
  fit: string;
  pattern: string;
  careInstruction: string;
  sizeGuide: string;
  normalPrice: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
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

      setCategories(categoriesData.categories || categoriesData);
      setImages(productData.images?.map((img: any) => img.url) || []);
      reset({
        categoryId: productData.categoryId,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        material: productData.material || '',
        fit: productData.fit || '',
        pattern: productData.pattern || '',
        careInstruction: productData.careInstruction || '',
        sizeGuide: productData.sizeGuide || '',
        normalPrice: productData.normalPrice,
        isNewArrival: productData.isNewArrival,
        isBestSeller: productData.isBestSeller,
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
      await productsApi.updateProduct(productId, {
        ...data,
        normalPrice: Number(data.normalPrice),
        images: images,
      });
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
    <div className="max-w-2xl mx-auto">
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
        className="bg-white rounded-lg shadow p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            {...register('categoryId', { required: 'Category is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name *</label>
          <input
            {...register('name', { required: 'Product name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug *</label>
          <input
            {...register('slug', { required: 'Slug is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Material</label>
            <input {...register('material')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fit</label>
            <input {...register('fit')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pattern</label>
            <input {...register('pattern')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Care Instruction</label>
            <textarea {...register('careInstruction')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Size Guide</label>
            <textarea {...register('sizeGuide')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Images</label>
          <div className="mt-2 space-y-2">
            {images.map((url, index) => (
              <img key={index} src={url} alt="Product" className="h-20 w-20 object-cover rounded" />
            ))}
            <ImageUploader onUploadComplete={(url) => setImages([...images, url])} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Normal Price (IDR) *</label>
          <input
            type="number"
            {...register('normalPrice', { required: true, valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center">
            <input type="checkbox" {...register('isNewArrival')} className="h-4 w-4" />
            <span className="ml-2 text-sm text-gray-700">New Arrival</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" {...register('isBestSeller')} className="h-4 w-4" />
            <span className="ml-2 text-sm text-gray-700">Best Seller</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4" />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
