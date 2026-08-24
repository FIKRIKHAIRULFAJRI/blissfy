import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should return mapped catalog products', async () => {
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
        stock: 5,
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
        stock: 3,
        isActive: true,
      },
    ]);

    productsRepositoryMock.findDiscounts.mockResolvedValue([]);

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

        primaryImage: {
          url: '/test.jpg',
          altText: 'Test Product',
        },

        colors: [
          {
            name: 'Charcoal',
            value: '#2C2C2A',
          },
        ],

        totalStock: 8,
        isAvailable: true,
      },
    ]);
  });

  it('should return null when product slug does not exist', async () => {
    productsRepositoryMock.findActiveProductBySlug.mockResolvedValue(null);

    await expect(
      service.getProductBySlug('does-not-exist'),
    ).resolves.toBeNull();
  });

  it('should return product detail with images and variants', async () => {
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
        id: 'image-1',
        productId: 'product-1',
        url: '/test.jpg',
        altText: null,
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
        stock: 5,
        isActive: true,
      },
    ]);

    productsRepositoryMock.findDiscounts.mockResolvedValue([]);

    const result = await service.getProductBySlug('test-product');

    expect(result?.slug).toBe('test-product');

    expect(result?.images).toEqual([
      {
        id: 'image-1',
        url: '/test.jpg',
        altText: 'Test Product',
      },
    ]);

    expect(result?.variants).toHaveLength(1);
    expect(result?.totalStock).toBe(5);
    expect(result?.isAvailable).toBe(true);
  });
});
