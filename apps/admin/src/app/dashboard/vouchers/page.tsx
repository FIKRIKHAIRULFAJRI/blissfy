'use client';

import { useState, useEffect } from 'react';
import { vouchersApi } from '@/lib/vouchers-api';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    startAt: '',
    endAt: '',
    usageLimit: 100,
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const data = await vouchersApi.list();
      setVouchers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vouchersApi.create(form);
      setForm({ code: '', type: 'percentage', value: 10, startAt: '', endAt: '', usageLimit: 100 });
      loadVouchers();
      alert('Voucher created successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to create voucher');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;
    try {
      await vouchersApi.delete(id);
      loadVouchers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete voucher');
    }
  };

  if (loading) return <div>Loading vouchers...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Voucher Management</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Create New Voucher</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="DISC2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="nominal">Nominal (IDR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <input
                type="number"
                required
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="datetime-local"
                required
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>

            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create Voucher
            </button>
          </form>
        </div>

        {/* Voucher List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Active Vouchers</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">{v.code}</td>
                  <td className="px-4 py-3">
                    {v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {v.used_count} / {v.usage_limit || '∞'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
