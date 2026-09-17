import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getSummary() {
    const query = `
      SELECT
        (SELECT COUNT(*)::int FROM orders WHERE fulfillment_status = 'pending') as pending_orders,
        (SELECT COUNT(*)::int FROM orders WHERE fulfillment_status = 'processing') as processing_orders,
        (SELECT COUNT(*)::int FROM products WHERE status = 'ACTIVE') as active_products,
        (SELECT SUM(total_payment)::numeric FROM orders WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days') as revenue_30d,
        (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days') as orders_30d
    `;
    
    const result = await this.db.query(query);
    return result.rows[0];
  }
}
