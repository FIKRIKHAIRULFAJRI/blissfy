/**
 * Orders module contracts
 */

import type { PaymentStatus, FulfillmentStatus } from '../common';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  sku: string;
  colorName: string;
  size: string;
  quantity: number;
  normalPrice: number;
  discountType: string | null;
  discountValue: number | null;
  discountLabel: string | null;
  salePrice: number;
  lineGross: number;
  lineDiscount: number;
  lineNet: number;
  weightGram: number;
  lineWeightGram: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  shippingQuoteId: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  recipientName: string;
  whatsapp: string;
  email: string;
  destinationProvinceId: string;
  destinationProvinceName: string;
  destinationCityId: string;
  destinationCityName: string;
  destinationDistrictId: string;
  destinationDistrictName: string;
  postalCode: string;
  address: string;
  orderNote: string | null;
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
  shippingCost: number;
  grossSubtotal: number;
  discountTotal: number;
  netSubtotal: number;
  totalWeightGram: number;
  totalPayment: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  payment?: OrderPayment;
  shipment?: OrderShipment;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  provider: string | null;
  gatewayTransactionId: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderShipment {
  id: string;
  orderId: string;
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
  shippingCost: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  customer: CustomerInput;
  shippingAddress: ShippingAddressInput;
  shippingQuoteId: string;
  notes?: string;
}

export interface CreateOrderItemInput {
  variantId: string;
  quantity: number;
}

export interface CustomerInput {
  name: string;
  email: string;
  whatsapp: string;
}

export interface ShippingAddressInput {
  province: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine: string;
}

export interface CreateOrderResponse {
  orderNumber: string;
  accessToken: string;
  payment: {
    status: PaymentStatus;
    amount: number;
    qrUrl: string | null;
    expiresAt: string;
  };
}

export interface GetOrdersQuery {
  page?: number;
  limit?: number;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface UpdateOrderStatusRequest {
  fulfillmentStatus: FulfillmentStatus;
}

export interface UpdateShipmentRequest {
  trackingNumber: string;
}
