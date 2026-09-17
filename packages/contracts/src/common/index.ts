/**
 * Common types shared across all modules
 */

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';

export type FulfillmentStatus =
  | 'WAITING_PAYMENT'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type StockReservationStatus = 'ACTIVE' | 'RELEASED' | 'CONSUMED' | 'EXPIRED';

export type InventoryMovementType =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_RELEASED'
  | 'SALE_CONFIRMED'
  | 'ADJUSTMENT';
