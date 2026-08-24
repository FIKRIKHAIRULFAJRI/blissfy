import { Injectable } from '@nestjs/common';
import type { VariantAvailability } from '../domain/inventory.types';
import { InventoryRepository } from '../infrastructure/inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async getVariantAvailability(
    variantIds: string[],
  ): Promise<Map<string, VariantAvailability>> {
    const rows = await this.inventoryRepository.findAvailability(variantIds);

    return new Map(
      rows.map((row) => {
        const available = Math.max(0, row.onHand - row.reserved);

        return [
          row.variantId,
          {
            variantId: row.variantId,
            onHand: row.onHand,
            reserved: row.reserved,
            available,
          },
        ];
      }),
    );
  }
}
