import { OrderSnapshotService } from './order-snapshot.service';
import { OrderSnapshotError } from '../domain/order.types';

describe('OrderSnapshotService', () => {
  const orderRepositoryMock = {
    findCatalogRows: jest.fn(),
    findDiscounts: jest.fn(),
  };

  const inventoryServiceMock = {
    getVariantAvailability: jest.fn(),
  };

  let service: OrderSnapshotService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new OrderSnapshotService(
      orderRepositoryMock as never,
      inventoryServiceMock as never,
    );
  });

  it('should build authoritative order snapshot with pricing, stock, and weight', async () => {
    orderRepositoryMock.findCatalogRows.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productName: 'Easy Straight Trouser',
        productIsActive: true,
        normalPrice: 200000,
        sku: 'EST-CHR-M',
        colorName: 'Charcoal',
        size: 'M',
        weightGram: 300,
        variantIsActive: true,
        packagingWeightGram: 100,
      },
    ]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(
      new Map([
        [
          'variant-1',
          {
            variantId: 'variant-1',
            onHand: 10,
            reserved: 2,
            available: 8,
          },
        ],
      ]),
    );

    orderRepositoryMock.findDiscounts.mockResolvedValue([
      {
        productId: 'product-1',
        type: 'PERCENTAGE',
        value: 10,
        startsAt: new Date('2020-01-01T00:00:00.000Z'),
        endsAt: new Date('2099-01-01T00:00:00.000Z'),
        isActive: true,
      },
    ]);

    const result = await service.build([
      {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
      },
    ]);

    expect(orderRepositoryMock.findCatalogRows).toHaveBeenCalledWith([
      'variant-1',
    ]);

    expect(inventoryServiceMock.getVariantAvailability).toHaveBeenCalledWith([
      'variant-1',
    ]);

    expect(orderRepositoryMock.findDiscounts).toHaveBeenCalledWith([
      'product-1',
    ]);

    expect(result.items).toEqual([
      {
        productId: 'product-1',
        variantId: 'variant-1',
        productName: 'Easy Straight Trouser',
        sku: 'EST-CHR-M',
        colorName: 'Charcoal',
        size: 'M',
        quantity: 2,

        normalPrice: 200000,

        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountLabel: '-10%',

        salePrice: 180000,

        lineGross: 400000,
        lineDiscount: 40000,
        lineNet: 360000,

        weightGram: 300,
        lineWeightGram: 600,
      },
    ]);

    expect(result.totals).toEqual({
      grossSubtotal: 400000,
      discountTotal: 40000,
      netSubtotal: 360000,

      totalProductWeightGram: 600,
      packagingWeightGram: 100,
      totalWeightGram: 700,
    });
  });

  it('should use available stock instead of on-hand stock', async () => {
    orderRepositoryMock.findCatalogRows.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productName: 'Easy Straight Trouser',
        productIsActive: true,
        normalPrice: 200000,
        sku: 'EST-CHR-M',
        colorName: 'Charcoal',
        size: 'M',
        weightGram: 300,
        variantIsActive: true,
        packagingWeightGram: 0,
      },
    ]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(
      new Map([
        [
          'variant-1',
          {
            variantId: 'variant-1',

            // Secara fisik ada 10.
            onHand: 10,

            // Tetapi 8 sedang direservasi.
            reserved: 8,

            // Jadi yang benar-benar dapat dibeli hanya 2.
            available: 2,
          },
        ],
      ]),
    );

    orderRepositoryMock.findDiscounts.mockResolvedValue([]);

    await expect(
      service.build([
        {
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 3,
        },
      ]),
    ).rejects.toMatchObject({
      name: 'OrderSnapshotError',
      code: 'STOCK_CHANGED',
      message: 'Stok berubah. Periksa ulang keranjang sebelum membuat pesanan.',
    });
  });

  it('should reject duplicate variant lines when aggregated quantity exceeds available stock', async () => {
    orderRepositoryMock.findCatalogRows.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productName: 'Easy Straight Trouser',
        productIsActive: true,
        normalPrice: 200000,
        sku: 'EST-CHR-M',
        colorName: 'Charcoal',
        size: 'M',
        weightGram: 300,
        variantIsActive: true,
        packagingWeightGram: 0,
      },
    ]);

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

    orderRepositoryMock.findDiscounts.mockResolvedValue([]);

    await expect(
      service.build([
        {
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 4,
        },
        {
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 4,
        },
      ]),
    ).rejects.toMatchObject({
      name: 'OrderSnapshotError',
      code: 'STOCK_CHANGED',
    });
  });

  it('should reject a variant that belongs to another product', async () => {
    orderRepositoryMock.findCatalogRows.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-real',
        productName: 'Easy Straight Trouser',
        productIsActive: true,
        normalPrice: 200000,
        sku: 'EST-CHR-M',
        colorName: 'Charcoal',
        size: 'M',
        weightGram: 300,
        variantIsActive: true,
        packagingWeightGram: 0,
      },
    ]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(
      new Map([
        [
          'variant-1',
          {
            variantId: 'variant-1',
            onHand: 10,
            reserved: 0,
            available: 10,
          },
        ],
      ]),
    );

    orderRepositoryMock.findDiscounts.mockResolvedValue([]);

    try {
      await service.build([
        {
          productId: 'product-fake',
          variantId: 'variant-1',
          quantity: 1,
        },
      ]);

      throw new Error('Expected order snapshot to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(OrderSnapshotError);

      expect(error as OrderSnapshotError).toMatchObject({
        code: 'VARIANT_PRODUCT_MISMATCH',
        message: 'Data produk dan varian tidak cocok. Perbarui keranjang.',
      });
    }
  });
});
