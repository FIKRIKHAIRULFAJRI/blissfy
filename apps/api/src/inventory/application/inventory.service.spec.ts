import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from '../infrastructure/inventory.repository';

describe('InventoryService adjustment', () => {
  const repository = { findAvailability: jest.fn(), adjustStock: jest.fn() };
  const service = new InventoryService(repository as unknown as InventoryRepository);

  beforeEach(() => jest.clearAllMocks());

  it('records a non-zero adjustment through the repository', async () => {
    repository.adjustStock.mockResolvedValue({ variantId: 'variant-1', previousStock: 4, stock: 9, quantityDelta: 5 });

    await expect(service.adjustStock('variant-1', { quantityDelta: 5, note: 'Restock supplier' })).resolves.toMatchObject({ stock: 9 });
    expect(repository.adjustStock).toHaveBeenCalledWith('variant-1', 5, 'Restock supplier');
  });

  it('rejects an adjustment without an audit note', async () => {
    await expect(service.adjustStock('variant-1', { quantityDelta: -1, note: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.adjustStock).not.toHaveBeenCalled();
  });
});
