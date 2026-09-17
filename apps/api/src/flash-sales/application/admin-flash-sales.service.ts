import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AdminFlashSalesService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const res = await this.db.query(`
      SELECT fs.*, p.name as product_name 
      FROM flash_sales fs
      JOIN products p ON fs.product_id = p.id
      ORDER BY fs.start_at DESC
    `);
    return res.rows;
  }

  async create(data: {
    productId: string;
    discountPrice: number;
    startAt: string;
    endAt: string;
    stock: number;
  }) {
    const res = await this.db.query(
      `INSERT INTO flash_sales (product_id, discount_price, start_at, end_at, stock, status) 
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [data.productId, data.discountPrice, data.startAt, data.endAt, data.stock]
    );
    return res.rows[0];
  }

  async delete(id: string) {
    await this.db.query('DELETE FROM flash_sales WHERE id = $1', [id]);
    return { success: true };
  }
}
