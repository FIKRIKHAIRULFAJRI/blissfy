import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../inventory/application/inventory.service';
import { CheckoutRepository } from '../infrastructure/checkout.repository';
import { CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;

  const checkoutRepositoryMock = {
    findVariants: jest.fn(),
    findDiscounts: jest.fn(),
  };

  const inventoryServiceMock = {
    getVariantAvailability: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: CheckoutRepository,
          useValue: checkoutRepositoryMock,
        },
        {
          provide: InventoryService,
          useValue: inventoryServiceMock,
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  it('should return an empty cart validation result', async () => {
    const result = await service.validateCart({
      items: [],
    });

    expect(result).toEqual({
      ok: true,
      items: [],
      invalidItems: [],
      notices: [],
      summary: {
        grossSubtotal: 0,
        discountTotal: 0,
        netSubtotal: 0,
        totalItems: 0,
        totalWeightGram: 0,
        allValid: false,
      },
    });

    expect(checkoutRepositoryMock.findVariants).not.toHaveBeenCalled();

    expect(inventoryServiceMock.getVariantAvailability).not.toHaveBeenCalled();
  });

  it('should use backend available stock instead of cart snapshot stock', async () => {
    checkoutRepositoryMock.findVariants.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        slug: 'easy-straight-trouser',
        name: 'Easy Straight Trouser',
        normalPrice: 229000,
        productIsActive: true,
        sku: 'BLF-EST-STO-M',
        colorName: 'Stone',
        colorHex: '#B9B4A8',
        size: 'M',
        weightGram: 430,
        variantIsActive: true,
        imageUrl: '/products/placeholder-stone.svg',
        imageAlt: null,
      },
    ]);

    checkoutRepositoryMock.findDiscounts.mockResolvedValue([]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(
      new Map([
        [
          'variant-1',
          {
            variantId: 'variant-1',
            onHand: 12,
            reserved: 3,
            available: 9,
          },
        ],
      ]),
    );

    const result = await service.validateCart({
      items: [
        {
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 1,
          normalPrice: 229000,
          salePrice: 229000,
          stock: 999,
        },
      ],
    });

    expect(result.items).toHaveLength(1);

    expect(result.items[0]).toMatchObject({
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 1,
      stock: 9,
      normalPrice: 229000,
      salePrice: 229000,
      lineGross: 229000,
      lineDiscount: 0,
      lineNet: 229000,
      lineWeightGram: 430,
    });

    expect(result.notices).toContainEqual({
      variantId: 'variant-1',
      type: 'stock_changed',
      message: 'Stok Easy Straight Trouser varian Stone/M berubah menjadi 9.',
    });

    expect(result.summary).toEqual({
      grossSubtotal: 229000,
      discountTotal: 0,
      netSubtotal: 229000,
      totalItems: 1,
      totalWeightGram: 430,
      allValid: true,
    });
  });

  it('should adjust quantity when requested quantity exceeds available stock', async () => {
    checkoutRepositoryMock.findVariants.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        slug: 'easy-straight-trouser',
        name: 'Easy Straight Trouser',
        normalPrice: 229000,
        productIsActive: true,
        sku: 'BLF-EST-STO-M',
        colorName: 'Stone',
        colorHex: '#B9B4A8',
        size: 'M',
        weightGram: 430,
        variantIsActive: true,
        imageUrl: null,
        imageAlt: null,
      },
    ]);

    checkoutRepositoryMock.findDiscounts.mockResolvedValue([]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(
      new Map([
        [
          'variant-1',
          {
            variantId: 'variant-1',
            onHand: 10,
            reserved: 3,
            available: 7,
          },
        ],
      ]),
    );

    const result = await service.validateCart({
      items: [
        {
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 10,
        },
      ],
    });

    expect(result.items[0]?.quantity).toBe(7);
    expect(result.items[0]?.stock).toBe(7);

    expect(result.notices).toContainEqual({
      variantId: 'variant-1',
      type: 'quantity_adjusted',
      message: 'Jumlah Easy Straight Trouser disesuaikan ke stok tersedia.',
    });

    expect(result.summary.totalItems).toBe(7);
    expect(result.summary.totalWeightGram).toBe(3010);
  });

  it('should mark a missing variant as invalid', async () => {
    checkoutRepositoryMock.findVariants.mockResolvedValue([]);

    checkoutRepositoryMock.findDiscounts.mockResolvedValue([]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(new Map());

    const result = await service.validateCart({
      items: [
        {
          productId: 'product-1',
          variantId: 'missing-variant',
          quantity: 1,
        },
      ],
    });

    expect(result.items).toEqual([]);

    expect(result.invalidItems).toEqual([
      {
        variantId: 'missing-variant',
        reason: 'Varian tidak ditemukan atau sudah dihapus.',
        stock: 0,
      },
    ]);

    expect(result.summary.allValid).toBe(false);
  });
});
