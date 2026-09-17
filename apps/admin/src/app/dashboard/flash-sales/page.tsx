'use client';

import { useState, useEffect } from 'react';
import { flashSalesApi } from '@/lib/flash-sales-api';
import { productsApi } from '@/lib/products-api';

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    productId: '',
    discountPrice: 0,
    startAt: '',
    endAt: '',
    stock: 10,
  });

  useEffect(() => {
    Promise.all([
      flashSalesApi.list().then(setFlashSales),
      productsApi.list().then(res => setProducts(res.data))
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await flashSalesApi.create(form);
    const data = await flashSalesApi.list();
    setFlashSales(data);
    alert('Flash Sale created');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Flash Sale Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <select onChange={e => setForm({...form, productId: e.target.value})} className="border p-2 rounded">
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" placeholder="Discount Price" onChange={e => setForm({...form, discountPrice: Number(e.target.value)})} className="border p-2 rounded" />
          <input type="datetime-local" onChange={e => setForm({...form, startAt: e.target.value})} className="border p-2 rounded" />
          <input type="datetime-local" onChange={e => setForm({...form, endAt: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Stock" onChange={e => setForm({...form, stock: Number(e.target.value)})} className="border p-2 rounded" />
          <button className="bg-red-600 text-white p-2 rounded col-span-2">Create Flash Sale</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr><th>Product</th><th>Price</th><th>Stock</th><th>Action</th></tr>
          </thead>
          <tbody>
            {flashSales.map(fs => (
              <tr key={fs.id}>
                <td>{fs.product_name}</td>
                <td>{fs.discount_price}</td>
                <td>{fs.stock}</td>
                <td><button onClick={() => flashSalesApi.delete(fs.id).then(() => flashSalesApi.list().then(setFlashSales))} className="text-red-600">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
