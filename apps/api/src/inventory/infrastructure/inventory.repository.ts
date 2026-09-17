import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

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

  async adjustStock(
    variantId: string,
    adjustment: number,
    reason: string,
  ): Promise<{
    variantId: string;
    previousStock: number;
    newStock: number;
  } | null> {
    return this.database.withTransaction(async (client) => {
      const locked = await client.query<{ stock: number }>(
        `SELECT stock FROM product_variants WHERE id::text = $1 FOR UPDATE`,
        [variantId],
      );
      const variant = locked.rows[0];
      
      if (!variant) {
        return null;
      }
      
      const nextStock = variant.stock + adjustment;
      
      if (nextStock < 0) {
        throw new ConflictException('Adjustment membuat stok menjadi negatif.');
      }
      
      await client.query(
        `UPDATE product_variants SET stock = $2, "updatedAt" = NOW() WHERE id::text = $1`,
        [variantId, nextStock],
      );
      
      await client.query(
        `INSERT INTO inventory_movements ("variantId", type, "quantityDelta", note) VALUES ($1, 'ADJUSTMENT', $2, $3)`,
        [variantId, adjustment, reason.trim()],
      );
      
      return {
        variantId,
        previousStock: variant.stock,
        newStock: nextStock,
      };
    });
  }
}
