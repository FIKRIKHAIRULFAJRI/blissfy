'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/products-api';
import type { Product } from '@blissfy/contracts/products';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getProducts({ page });
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await productsApi.updateProductStatus(id, !currentStatus);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await productsApi.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No products yet</p>
          <Link
            href="/dashboard/products/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.slug}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Rp {product.normalPrice.toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        handleToggleStatus(product.id, product.isActive)
                      }
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
