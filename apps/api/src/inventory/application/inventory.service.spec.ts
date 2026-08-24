import { Test, TestingModule } from '@nestjs/testing';
import { InventoryRepository } from '../infrastructure/inventory.repository';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const inventoryRepositoryMock = {
    findAvailability: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: inventoryRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should calculate available stock from on-hand minus reserved', async () => {
    inventoryRepositoryMock.findAvailability.mockResolvedValue([
      {
        variantId: 'variant-1',
        onHand: 10,
        reserved: 3,
      },
    ]);

    const result = await service.getVariantAvailability(['variant-1']);

    expect(result.get('variant-1')).toEqual({
      variantId: 'variant-1',
      onHand: 10,
      reserved: 3,
      available: 7,
    });
  });

  it('should never return negative available stock', async () => {
    inventoryRepositoryMock.findAvailability.mockResolvedValue([
      {
        variantId: 'variant-1',
        onHand: 2,
        reserved: 5,
      },
    ]);

    const result = await service.getVariantAvailability(['variant-1']);

    expect(result.get('variant-1')).toEqual({
      variantId: 'variant-1',
      onHand: 2,
      reserved: 5,
      available: 0,
    });
  });
});
