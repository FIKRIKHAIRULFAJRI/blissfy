import "server-only";

import { db } from "@/lib/db";
import { hashSecret } from "@/lib/orders/hash";

type OrderRow = {
  orderNumber: string;
  paymentStatus: "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED";
  fulfillmentStatus:
    | "WAITING_PAYMENT"
    | "PROCESSING"
    | "PACKED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  recipientName: string;
  email: string;
  destinationCityName: string;
  destinationDistrictName: string;
  courierName: string;
  serviceName: string;
  estimatedDelivery: string;
  shippingCost: number;
  grossSubtotal: number;
  discountTotal: number;
  netSubtotal: number;
  totalWeightGram: number;
  totalPayment: number;
  expiresAt: Date;
  createdAt: Date;
};

type OrderItemRow = {
  productName: string;
  sku: string;
  colorName: string;
  size: string;
  quantity: number;
  normalPrice: number;
  discountLabel: string | null;
  salePrice: number;
  lineNet: number;
  lineWeightGram: number;
};

export type PaymentOrder = OrderRow & {
  items: OrderItemRow[];
};

export async function getPaymentOrderByAccessToken(accessToken: string) {
  const tokenHash = hashSecret(accessToken);
  const orderResult = await db.query<OrderRow & { id: string }>(
    `
      SELECT
        id,
        "orderNumber",
        "paymentStatus"::text AS "paymentStatus",
        "fulfillmentStatus"::text AS "fulfillmentStatus",
        "recipientName",
        email,
        "destinationCityName",
        "destinationDistrictName",
        "courierName",
        "serviceName",
        "estimatedDelivery",
        "shippingCost",
        "grossSubtotal",
        "discountTotal",
        "netSubtotal",
        "totalWeightGram",
        "totalPayment",
        "expiresAt",
        "createdAt"
      FROM orders
      WHERE "accessTokenHash" = $1
      LIMIT 1
    `,
    [tokenHash],
  );
  const order = orderResult.rows[0];

  if (!order) {
    return null;
  }

  const itemResult = await db.query<OrderItemRow>(
    `
      SELECT
        "productName",
        sku,
        "colorName",
        size,
        quantity,
        "normalPrice",
        "discountLabel",
        "salePrice",
        "lineNet",
        "lineWeightGram"
      FROM order_items
      WHERE "orderId" = $1
      ORDER BY "createdAt" ASC
    `,
    [order.id],
  );

  return {
    ...order,
    items: itemResult.rows,
  };
}
