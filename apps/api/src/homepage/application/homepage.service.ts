import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class HomepageService {
  constructor(private readonly db: DatabaseService) {}

  async getSections() {
    const res = await this.db.query('SELECT * FROM homepage_sections ORDER BY sort_order ASC');
    return res.rows;
  }

  async updateSection(id: string, data: { is_active?: boolean; title?: string }) {
    const res = await this.db.query(
      'UPDATE homepage_sections SET is_active = COALESCE($1, is_active), title = COALESCE($2, title) WHERE id = $3 RETURNING *',
      [data.is_active, data.title, id]
    );
    return res.rows[0];
  }

  async getBanners() {
    const res = await this.db.query('SELECT * FROM banners ORDER BY sort_order ASC');
    return res.rows;
  }

  async createBanner(data: any) {
    const res = await this.db.query(
      `INSERT INTO banners (title, subtitle, desktop_image_url, mobile_image_url, cta_text, target_url, is_active, sort_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.title, data.subtitle, data.desktop_image_url, data.mobile_image_url, data.cta_text, data.target_url, data.is_active ?? true, data.sort_order ?? 0]
    );
    return res.rows[0];
  }

  async deleteBanner(id: string) {
    await this.db.query('DELETE FROM banners WHERE id = $1', [id]);
  }
}
