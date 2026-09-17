'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface DashboardMetrics {
  pending_orders: number;
  processing_orders: number;
  active_products: number;
  revenue_30d: number;
  orders_30d: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<DashboardMetrics>('/v1/admin/dashboard/summary')
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Revenue (30d)</div>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.revenue_30d || 0)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Orders (30d)</div>
          <div className="text-2xl font-bold">{metrics?.orders_30d}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Pending Orders</div>
          <div className="text-2xl font-bold">{metrics?.pending_orders}</div>
        </div>
      </div>
    </div>
  );
}
