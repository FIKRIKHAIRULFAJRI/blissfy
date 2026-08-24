import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

type AvailabilityRow = {
  variantId: string;
  onHand: number;
  reserved: number;
};

@Injectable()
export class InventoryRepository {
  constructor(private readonly database: DatabaseService) {}

  async findAvailability(variantIds: string[]): Promise<AvailabilityRow[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const result = await this.database.query<AvailabilityRow>(
      `
          SELECT
            v.id::text AS "variantId",
            v.stock AS "onHand",
            COALESCE(
              SUM(r.quantity) FILTER (
                WHERE r.status = 'ACTIVE'
                  AND r."expiresAt" > NOW()
              ),
              0
            )::int AS reserved
          FROM product_variants v
          LEFT JOIN stock_reservations r
            ON r."variantId" = v.id
          WHERE v.id::text = ANY($1::text[])
          GROUP BY v.id, v.stock
        `,
      [variantIds],
    );

    return result.rows;
  }
}
