import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../inventory/application/inventory.service';
import { ProductsRepository } from '../infrastructure/products.repository';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const productsRepositoryMock = {
    findActiveProducts: jest.fn(),
    findActiveProductBySlug: jest.fn(),
    findImages: jest.fn(),
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
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
        {
          provide: InventoryService,
          useValue: inventoryServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should return mapped catalog products using available stock', async () => {
    productsRepositoryMock.findActiveProducts.mockResolvedValue([
      {
        id: 'product-1',
        slug: 'test-product',
        name: 'Test Product',
        description: 'Test description',
        categoryName: 'Tops',
        normalPrice: 200000,
      },
    ]);

    productsRepositoryMock.findImages.mockResolvedValue([
      {
        id: 'image-1',
        productId: 'product-1',
        url: '/test.jpg',
        altText: null,
        publicId: 'blissfy/product-1/front',
        sortOrder: 0,
        isPrimary: true,
        createdAt: new Date('2026-08-30T00:00:00.000Z'),
      },
    ]);

    productsRepositoryMock.findVariants.mockResolvedValue([
      {
        id: 'variant-1',
        productId: 'product-1',
        sku: 'SKU-001',
        colorName: 'Charcoal',
        colorHex: '#2C2C2A',
        size: 'M',
        weightGram: 300,
        stock: 10,
        isActive: true,
      },
      {
        id: 'variant-2',
        productId: 'product-1',
        sku: 'SKU-002',
        colorName: 'Charcoal',
        colorHex: '#2C2C2A',
        size: 'L',
        weightGram: 310,
        stock: 8,
        isActive: true,
      },
    ]);

    productsRepositoryMock.findDiscounts.mockResolvedValue([]);

    inventoryServiceMock.getVariantAvailability.mockResolvedValue(
      new Map([
        [
          'variant-1',
          {
            variantId: 'variant-1',
            onHand: 10,
            reserved: 4,
            available: 6,
          },
        ],
        [
          'variant-2',
          {
            variantId: 'variant-2',
            onHand: 8,
            reserved: 3,
            available: 5,
          },
        ],
      ]),
    );

    const result = await service.getCatalogProducts();

    expect(result).toEqual([
      {
        id: 'product-1',
        slug: 'test-product',
        name: 'Test Product',
        description: 'Test description',
        categoryName: 'Tops',
        normalPrice: 200000,
        salePrice: 200000,
        discountLabel: null,

        images: [
          {
            id: 'image-1',
            url: '/test.jpg',
            altText: 'Test Product',
            sortOrder: 0,
            isPrimary: true,
          },
        ],

        primaryImage: {
          id: 'image-1',
          url: '/test.jpg',
          altText: 'Test Product',
          sortOrder: 0,
          isPrimary: true,
        },

        colors: [
          {
            name: 'Charcoal',
            value: '#2C2C2A',
          },
        ],

        totalStock: 11,
        isAvailable: true,
      },
    ]);
  });

  it('should return null when product slug does not exist', async () => {
    productsRepositoryMock.findActiveProductBySlug.mockResolvedValue(null);

    await expect(
      service.getProductBySlug('does-not-exist'),
    ).resolves.toBeNull();

    expect(inventoryServiceMock.getVariantAvailability).not.toHaveBeenCalled();
  });

  it('should return product detail using available variant stock', async () => {
    productsRepositoryMock.findActiveProductBySlug.mockResolvedValue({
      id: 'product-1',
      slug: 'test-product',
      name: 'Test Product',
      description: 'Test description',
      categoryName: 'Tops',
      normalPrice: 200000,
    });

    productsRepositoryMock.findImages.mockResolvedValue([
      {
        id: 'image-2',
        productId: 'product-1',
        url: '/test-back.jpg',
        altText: 'Test Product back view',
        publicId: null,
        sortOrder: 1,
        isPrimary: false,
        createdAt: new Date('2026-08-30T00:01:00.000Z'),
      },
      {
        id: 'image-1',
        productId: 'product-1',
        url: '/test.jpg',
        altText: null,
        publicId: 'blissfy/product-1/front',
        sortOrder: 0,
        isPrimary: true,
        createdAt: new Date('2026-08-30T00:00:00.000Z'),
      },
    ]);

    productsRepositoryMock.findVariants.mockResolvedValue([
      {
        id: 'variant-1',
        productId: 'product-1',
        sku: 'SKU-001',
        colorName: 'Charcoal',
        colorHex: '#2C2C2A',
        size: 'M',
        weightGram: 300,
        stock: 10,
        isActive: true,
      },
    ]);

    productsRepositoryMock.findDiscounts.mockResolvedValue([]);

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

    const result = await service.getProductBySlug('test-product');

    expect(result?.slug).toBe('test-product');

    expect(result?.images).toEqual([
      {
        id: 'image-1',
        url: '/test.jpg',
        altText: 'Test Product',
        sortOrder: 0,
        isPrimary: true,
      },
      {
        id: 'image-2',
        url: '/test-back.jpg',
        altText: 'Test Product back view',
        sortOrder: 1,
        isPrimary: false,
      },
    ]);

    expect(result?.primaryImage).toEqual(result?.images[0]);

    expect(result?.variants).toEqual([
      {
        id: 'variant-1',
        sku: 'SKU-001',
        colorName: 'Charcoal',
        colorHex: '#2C2C2A',
        size: 'M',
        weightGram: 300,
        stock: 7,
        isActive: true,
      },
    ]);

    expect(result?.totalStock).toBe(7);
    expect(result?.isAvailable).toBe(true);
  });

  it('should return a stable presentation fallback when a product has no images', async () => {
    productsRepositoryMock.findActiveProducts.mockResolvedValue([
      {
        id: 'product-without-image',
        slug: 'product-without-image',
        name: 'Product Without Image',
        description: 'Fallback test',
        categoryName: 'Essentials',
        normalPrice: 100000,
      },
    ]);
    productsRepositoryMock.findImages.mockResolvedValue([]);
    productsRepositoryMock.findVariants.mockResolvedValue([]);
    productsRepositoryMock.findDiscounts.mockResolvedValue([]);
    inventoryServiceMock.getVariantAvailability.mockResolvedValue(new Map());

    const [result] = await service.getCatalogProducts();

    expect(result.images).toEqual([]);
    expect(result.primaryImage).toEqual({
      id: 'fallback:product-without-image',
      url: '/products/placeholder-ivory.svg',
      altText: 'Product Without Image',
      sortOrder: 0,
      isPrimary: true,
    });
  });

  it('should use the first ordered image when no image is explicitly primary', async () => {
    productsRepositoryMock.findActiveProducts.mockResolvedValue([
      {
        id: 'product-1',
        slug: 'test-product',
        name: 'Test Product',
        description: 'Ordering test',
        categoryName: 'Essentials',
        normalPrice: 100000,
      },
    ]);
    productsRepositoryMock.findImages.mockResolvedValue([
      {
        id: 'image-later',
        productId: 'product-1',
        url: '/later.jpg',
        altText: null,
        publicId: null,
        sortOrder: 2,
        isPrimary: false,
        createdAt: new Date('2026-08-30T00:02:00.000Z'),
      },
      {
        id: 'image-first',
        productId: 'product-1',
        url: '/first.jpg',
        altText: null,
        publicId: null,
        sortOrder: 0,
        isPrimary: false,
        createdAt: new Date('2026-08-30T00:00:00.000Z'),
      },
    ]);
    productsRepositoryMock.findVariants.mockResolvedValue([]);
    productsRepositoryMock.findDiscounts.mockResolvedValue([]);
    inventoryServiceMock.getVariantAvailability.mockResolvedValue(new Map());

    const [result] = await service.getCatalogProducts();

    expect(result.images.map((image) => image.id)).toEqual([
      'image-first',
      'image-later',
    ]);
    expect(result.primaryImage.id).toBe('image-first');
  });
});
