'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/orders-api';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getById(orderId);
      setOrder(data);
      setTrackingNumber(data.tracking_number || '');
      setFulfillmentStatus(data.fulfillment_status);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFulfillmentStatus = async (newStatus: string) => {
    if (!confirm(`Update fulfillment status to ${newStatus}?`)) return;

    try {
      setUpdating(true);
      await ordersApi.updateFulfillmentStatus(orderId, {
        fulfillmentStatus: newStatus,
      });
      await fetchOrder();
      alert('Fulfillment status updated');
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!trackingNumber.trim()) {
      alert('Please enter tracking number');
      return;
    }

    try {
      setUpdating(true);
      await ordersApi.updateTracking(orderId, { trackingNumber });
      await fetchOrder();
      alert('Tracking number updated');
    } catch (err: any) {
      alert(err.message || 'Failed to update tracking');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Order not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Back to Orders
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Order {order.order_number}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Created: {formatDate(order.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-gray-500">
                        {item.color_name} / {item.size}
                      </div>
                      <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                    </td>
                    <td className="text-right">{formatCurrency(item.sale_price)}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right font-medium">
                      {formatCurrency(item.line_net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2">
                <tr>
                  <td colSpan={3} className="text-right py-2 font-medium">
                    Subtotal:
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(order.net_subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right py-2 font-medium">
                    Shipping:
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(order.shipping_cost)}
                  </td>
                </tr>
                <tr className="text-lg">
                  <td colSpan={3} className="text-right py-2 font-bold">
                    Total:
                  </td>
                  <td className="text-right py-2 font-bold">
                    {formatCurrency(order.total_payment)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{order.recipient_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{order.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">WhatsApp</div>
                <div className="font-medium">{order.whatsapp}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <p>{order.address}</p>
              <p>
                {order.destination_district_name}, {order.destination_city_name}
              </p>
              <p>
                {order.destination_province_name} {order.postal_code}
              </p>
            </div>
            {order.order_note && (
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <div className="text-sm font-medium text-yellow-800">Note:</div>
                <div className="text-sm text-yellow-700">{order.order_note}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.payment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
              {order.paid_at && (
                <div>
                  <div className="text-sm text-gray-500">Paid At</div>
                  <div className="font-medium">{formatDate(order.paid_at)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="font-bold text-lg">
                  {formatCurrency(order.payment_amount)}
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Fulfillment</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Current Status</div>
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                    order.fulfillment_status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.fulfillment_status === 'shipped'
                      ? 'bg-purple-100 text-purple-800'
                      : order.fulfillment_status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.fulfillment_status}
                </span>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-2">
                  Update Status
                </label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => handleUpdateFulfillmentStatus(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Courier</div>
                <div className="font-medium">
                  {order.courier_name} - {order.service_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Estimated Delivery</div>
                <div className="font-medium">{order.estimated_delivery}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Cost</div>
                <div className="font-medium">
                  {formatCurrency(order.shipping_cost)}
                </div>
              </div>

              <div className="pt-3 border-t">
                <label className="text-sm text-gray-500 block mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                />
                <button
                  onClick={handleUpdateTracking}
                  disabled={updating || !trackingNumber.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Tracking'}
                </button>
              </div>

              {order.shipped_at && (
                <div>
                  <div className="text-sm text-gray-500">Shipped At</div>
                  <div className="font-medium">{formatDate(order.shipped_at)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
