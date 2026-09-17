/**
 * Orders API client for Admin
 */

import { apiClient } from './api-client';
import type {
  Order,
  OrderWithItems,
  GetOrdersQuery,
  UpdateOrderStatusRequest,
  UpdateShipmentRequest,
} from '@blissfy/contracts/orders';
import type { ApiListResponse } from '@blissfy/contracts/common';

export const ordersApi = {
  /**
   * List orders with filters and pagination
   */
  async list(query: GetOrdersQuery = {}) {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.paymentStatus) params.append('paymentStatus', query.paymentStatus);
    if (query.fulfillmentStatus) params.append('fulfillmentStatus', query.fulfillmentStatus);
    if (query.search) params.append('search', query.search);
    if (query.fromDate) params.append('fromDate', query.fromDate);
    if (query.toDate) params.append('toDate', query.toDate);

    const queryString = params.toString();
    const url = `/v1/admin/orders${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<{
      orders: Order[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  /**
   * Get single order by ID with items
   */
  async getById(id: string) {
    return apiClient.get<OrderWithItems>(`/v1/admin/orders/${id}`);
  },

  /**
   * Update order fulfillment status
   */
  async updateFulfillmentStatus(id: string, data: UpdateOrderStatusRequest) {
    return apiClient.patch<Order>(`/v1/admin/orders/${id}/fulfillment-status`, data);
  },

  /**
   * Update shipment tracking number
   */
  async updateTracking(id: string, data: UpdateShipmentRequest) {
    return apiClient.patch(`/v1/admin/orders/${id}/tracking`, data);
  },
};
