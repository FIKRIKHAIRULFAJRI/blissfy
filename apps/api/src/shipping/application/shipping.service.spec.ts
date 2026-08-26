import { HttpException } from '@nestjs/common';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  const shippingRepositoryMock = {
    findVariants: jest.fn(),
    persistShippingQuotes: jest.fn(),
  };

  const inventoryServiceMock = {
    getVariantAvailability: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const shippingProviderMock = {
    getRegions: jest.fn(),
    getRates: jest.fn(),
  };

  let service: ShippingService;

  beforeEach(() => {
    jest.clearAllMocks();

    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'SHIPPING_ORIGIN_DISTRICT_ID') {
        return '100';
      }

      return undefined;
    });

    service = new ShippingService(
      shippingRepositoryMock as never,
      inventoryServiceMock as never,
      configServiceMock as never,
      shippingProviderMock,
    );
  });

  it('should return regions from the shipping provider', async () => {
    shippingProviderMock.getRegions.mockResolvedValue([
      {
        id: '5',
        name: 'JAWA BARAT',
        postalCode: null,
      },
    ]);

    const result = await service.getRegions({
      level: 'province',
    });

    expect(shippingProviderMock.getRegions).toHaveBeenCalledWith({
      level: 'province',
    });

    expect(result).toEqual({
      ok: true,
      regions: [
        {
          id: '5',
          name: 'JAWA BARAT',
          postalCode: null,
        },
      ],
    });
  });

  it('should calculate shipping using authoritative weight and available stock', async () => {
    shippingRepositoryMock.findVariants.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productIsActive: true,
        variantIsActive: true,
        weightGram: 430,
        packagingWeightGram: 100,
      },
    ]);

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

    shippingProviderMock.getRates.mockResolvedValue([
      {
        quoteId: 'provider-quote-1',
        courierCode: 'jne',
        courierName: 'JNE',
        serviceCode: 'REG',
        serviceName: 'Regular',
        cost: 19000,
        estimatedDelivery: '1 day',
        destinationId: '423',
        totalWeightGrams: 530,
      },
    ]);

    shippingRepositoryMock.persistShippingQuotes.mockResolvedValue(undefined);

    const result = await service.getRates({
      destinationDistrictId: '423',
      destination: {
        provinceId: '5',
        provinceName: 'JAWA BARAT',
        cityId: '55',
        cityName: 'BANDUNG',
        districtId: '423',
        districtName: 'BANDUNG',
      },
      items: [
        {
          productId: 'product-1',
          variantId: 'variant-1',
          quantity: 1,

          // Snapshot client sengaja salah.
          normalPrice: 1,
          salePrice: 1,
          stock: 999,
        },
      ],
    });

    expect(shippingProviderMock.getRates).toHaveBeenCalledWith({
      originDistrictId: '100',
      destinationDistrictId: '423',
      weightGrams: 530,
      couriers: ['jne', 'jnt'],
    });

    expect(result.totalProductWeightGrams).toBe(430);
    expect(result.packagingWeightGrams).toBe(100);
    expect(result.totalWeightGrams).toBe(530);

    expect(result.quotes).toHaveLength(1);

    expect(shippingRepositoryMock.persistShippingQuotes).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should reject quantity above available stock', async () => {
    shippingRepositoryMock.findVariants.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productIsActive: true,
        variantIsActive: true,
        weightGram: 430,
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
            reserved: 8,
            available: 2,
          },
        ],
      ]),
    );

    try {
      await service.getRates({
        destinationDistrictId: '423',
        items: [
          {
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 3,
          },
        ],
      });

      throw new Error('Expected request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);

      expect((error as HttpException).getStatus()).toBe(400);

      expect((error as HttpException).getResponse()).toMatchObject({
        ok: false,
        code: 'SHIPPING_BAD_REQUEST',
        message: 'Stok salah satu varian tidak mencukupi.',
      });
    }

    expect(shippingProviderMock.getRates).not.toHaveBeenCalled();
  });

  it('should reject unsupported shipping location', async () => {
    shippingRepositoryMock.findVariants.mockResolvedValue([
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productIsActive: true,
        variantIsActive: true,
        weightGram: 430,
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

    shippingProviderMock.getRates.mockResolvedValue([]);

    try {
      await service.getRates({
        destinationDistrictId: '423',
        items: [
          {
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 1,
          },
        ],
      });

      throw new Error('Expected request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);

      expect((error as HttpException).getStatus()).toBe(422);

      expect((error as HttpException).getResponse()).toMatchObject({
        ok: false,
        code: 'SHIPPING_UNSUPPORTED_LOCATION',
      });
    }
  });
});
