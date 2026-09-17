import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable( )
export class AdminVouchersService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const res = await this.db.query('SELECT * FROM vouchers ORDER BY created_at DESC');
    return res.rows;
  }

  async create(data: {
    code: string;
    type: 'percentage' | 'nominal';
    value: number;
    startAt: string;
    endAt: string;
    usageLimit?: number;
  }) {
    const res = await this.db.query(
      `INSERT INTO vouchers (code, type, value, start_at, end_at, usage_limit, status) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
      [data.code.toUpperCase(), data.type, data.value, data.startAt, data.endAt, data.usageLimit || null]
    );
    return res.rows[0];
  }

  async delete(id: string) {
    await this.db.query('DELETE FROM vouchers WHERE id = $1', [id]);
    return { success: true };
  }
}
