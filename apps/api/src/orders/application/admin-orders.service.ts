import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface GetOrdersQuery {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class AdminOrdersService {
  constructor(private readonly db: DatabaseService) {}

  async listOrders(query: GetOrdersQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.paymentStatus) {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(query.paymentStatus);
    }

    if (query.fulfillmentStatus) {
      conditions.push(`o.fulfillment_status = $${paramIndex++}`);
      params.push(query.fulfillmentStatus);
    }

    if (query.search) {
      conditions.push(`(
        o.order_number ILIKE $${paramIndex} OR
        o.recipient_name ILIKE $${paramIndex} OR
        o.email ILIKE $${paramIndex} OR
        o.whatsapp ILIKE $${paramIndex}
      )`);
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    if (query.fromDate) {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(query.fromDate);
    }

    if (query.toDate) {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(query.toDate);
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countResult = await this.db.query(
      `
      SELECT COUNT(*)::int as total
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE ${whereClause}
    `,
      params,
    );

    const total = countResult.rows[0]?.total || 0;

    // Get orders
    const result = await this.db.query(
      `
      SELECT 
        o.id,
        o.order_number,
        o.recipient_name,
        o.email,
        o.whatsapp,
        o.fulfillment_status,
        o.total_payment,
        o.created_at,
        p.status as payment_status,
        p.paid_at,
        s.tracking_number,
        s.shipped_at,
        (
          SELECT COUNT(*)::int
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) as items_count
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset],
    );

    return {
      orders: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string) {
    const result = await this.db.query(
      `
      SELECT 
        o.*,
        p.id as payment_id,
        p.status as payment_status,
        p.amount as payment_amount,
        p.provider as payment_provider,
        p.paid_at,
        p.expires_at as payment_expires_at,
        s.id as shipment_id,
        s.courier_code,
        s.courier_name,
        s.service_code,
        s.service_name,
        s.shipping_cost,
        s.tracking_number,
        s.shipped_at
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await this.db.query(
      `
      SELECT * FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC
    `,
      [id],
    );

    return {
      ...order,
      items: itemsResult.rows,
    };
  }

  async updateFulfillmentStatus(id: string, status: string) {
    const result = await this.db.query(
      `
      UPDATE orders
      SET 
        fulfillment_status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [status, id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async updateTrackingNumber(id: string, trackingNumber: string) {
    const result = await this.db.query(
      `
      UPDATE shipments
      SET 
        tracking_number = $1,
        shipped_at = CASE 
          WHEN shipped_at IS NULL THEN NOW() 
          ELSE shipped_at 
        END
      WHERE order_id = $2
      RETURNING *
    `,
      [trackingNumber, id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Also update order fulfillment status to 'shipped' if not already
    await this.db.query(
      `
      UPDATE orders
      SET 
        fulfillment_status = CASE 
          WHEN fulfillment_status = 'pending' THEN 'shipped'
          ELSE fulfillment_status
        END,
        updated_at = NOW()
      WHERE id = $1
    `,
      [id],
    );

    return result.rows[0];
  }
}
