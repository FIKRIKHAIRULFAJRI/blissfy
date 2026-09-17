/**
 * Admin module contracts
 */

import type { InventoryMovementType } from '../common';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
}

export interface AdminSession {
  user: AdminUser;
  expiresAt: string;
}

// Upload contracts

export interface UploadSignatureRequest {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export interface RegisterImageRequest {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  altText?: string;
}

export interface UpdateImageRequest {
  altText?: string;
  sortOrder?: number;
}

export interface ReorderImagesRequest {
  imageIds: string[];
}

export interface SetPrimaryImageRequest {
  imageId: string;
}

// Inventory contracts

export interface AdjustStockRequest {
  adjustment: number;
  reason: string;
}

export interface InventoryMovement {
  id: string;
  variantId: string | null;
  orderId: string | null;
  reservationId: string | null;
  type: InventoryMovementType;
  quantityDelta: number;
  note: string | null;
  createdAt: string;
}

export interface GetInventoryMovementsQuery {
  variantId?: string;
  page?: number;
  limit?: number;
}

// Dashboard

export interface DashboardSummary {
  totalOrders: number;
  pendingPayments: number;
  processingOrders: number;
  revenue: number;
  lowStockVariants: number;
}
