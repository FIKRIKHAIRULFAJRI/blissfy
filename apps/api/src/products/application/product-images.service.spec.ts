import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ProductImagesService } from './product-images.service';
import { PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES } from '../domain/product-image.constants';
import { CloudinaryService } from '../infrastructure/cloudinary.service';
import {
  ProductImageNotFoundError,
  ProductImageOrderError,
  ProductsRepository,
  type ImageRow,
} from '../infrastructure/products.repository';

describe('ProductImagesService', () => {
  const productsRepository = {
    findProductForImageManagement: jest.fn(),
    countProductImages: jest.fn(),
    listProductImages: jest.fn(),
    createProductImages: jest.fn(),
    setPrimaryProductImage: jest.fn(),
    reorderProductImages: jest.fn(),
    findProductImageForManagement: jest.fn(),
    deleteProductImageMetadata: jest.fn(),
  };
  const cloudinaryService = {
    uploadProductImage: jest.fn(),
    destroyProductImage: jest.fn(),
  };
  const service = new ProductImagesService(
    productsRepository as unknown as ProductsRepository,
    cloudinaryService as unknown as CloudinaryService,
  );

  const primaryImage: ImageRow = {
    id: 'image-1',
    productId: 'product-1',
    url: 'https://res.cloudinary.com/demo/image/upload/image-1.jpg',
    altText: 'Test Product',
    publicId: 'blissfy/products/product-1/image-1',
    sortOrder: 0,
    isPrimary: true,
    createdAt: new Date('2026-08-30T00:00:00.000Z'),
  };
  const secondImage: ImageRow = {
    ...primaryImage,
    id: 'image-2',
    url: 'https://res.cloudinary.com/demo/image/upload/image-2.jpg',
    publicId: 'blissfy/products/product-1/image-2',
    sortOrder: 1,
    isPrimary: false,
    createdAt: new Date('2026-08-30T00:01:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    productsRepository.findProductForImageManagement.mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
    });
    productsRepository.countProductImages.mockResolvedValue(0);
    cloudinaryService.destroyProductImage.mockResolvedValue(undefined);
  });

  function file(
    name: string,
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File {
    const mimeType = overrides.mimetype ?? 'image/jpeg';
    const buffer =
      mimeType === 'image/png'
        ? Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        : mimeType === 'image/webp'
          ? Buffer.from('RIFF0000WEBP', 'ascii')
          : Buffer.from([0xff, 0xd8, 0xff, 0x00]);

    return {
      buffer,
      destination: '',
      encoding: '7bit',
      fieldname: 'files',
      filename: '',
      mimetype: mimeType,
      originalname: name,
      path: '',
      size: buffer.length,
      stream: null as never,
      ...overrides,
    };
  }

  function upload(publicId: string) {
    return {
      secureUrl: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
      publicId,
      width: 2000,
      height: 2667,
      format: 'jpg',
      bytes: 500_000,
    };
  }

  it('uploads multiple files and persists deterministic primary/order metadata', async () => {
    cloudinaryService.uploadProductImage
      .mockResolvedValueOnce(upload('image-1'))
      .mockResolvedValueOnce(upload('image-2'));
    productsRepository.createProductImages.mockResolvedValue([
      primaryImage,
      secondImage,
    ]);

    const result = await service.uploadImages('product-1', [
      file('front.jpg'),
      file('back.webp', { mimetype: 'image/webp' }),
    ]);

    expect(cloudinaryService.uploadProductImage).toHaveBeenCalledTimes(2);
    expect(productsRepository.createProductImages).toHaveBeenCalledWith(
      expect.objectContaining({
        altText: 'Test Product',
        maxImages: 8,
        productId: 'product-1',
        uploads: [upload('image-1'), upload('image-2')],
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({ id: 'image-1', isPrimary: true, sortOrder: 0 }),
      expect.objectContaining({
        id: 'image-2',
        isPrimary: false,
        sortOrder: 1,
      }),
    ]);
  });

  it('rejects an unsupported MIME type before Cloudinary is called', async () => {
    await expect(
      service.uploadImages('product-1', [
        file('unsafe.svg', { mimetype: 'image/svg+xml' }),
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudinaryService.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects an oversized file before Cloudinary is called', async () => {
    await expect(
      service.uploadImages('product-1', [
        file('large.jpg', { size: PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES + 1 }),
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudinaryService.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects spoofed image content even when the MIME header is allowed', async () => {
    await expect(
      service.uploadImages('product-1', [
        file('fake.jpg', {
          buffer: Buffer.from('<html>not an image</html>'),
          mimetype: 'image/jpeg',
        }),
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudinaryService.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects an unknown product before uploading', async () => {
    productsRepository.findProductForImageManagement.mockResolvedValue(null);

    await expect(
      service.uploadImages('missing-product', [file('front.jpg')]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(cloudinaryService.uploadProductImage).not.toHaveBeenCalled();
  });

  it('rejects uploads that would exceed the product image limit', async () => {
    productsRepository.countProductImages.mockResolvedValue(7);

    await expect(
      service.uploadImages('product-1', [file('front.jpg'), file('back.jpg')]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudinaryService.uploadProductImage).not.toHaveBeenCalled();
  });

  it('does not create metadata and cleans earlier assets after Cloudinary failure', async () => {
    cloudinaryService.uploadProductImage
      .mockResolvedValueOnce(upload('image-1'))
      .mockRejectedValueOnce(
        new ServiceUnavailableException('Cloudinary unavailable.'),
      );

    await expect(
      service.uploadImages('product-1', [file('front.jpg'), file('back.jpg')]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(productsRepository.createProductImages).not.toHaveBeenCalled();
    expect(cloudinaryService.destroyProductImage).toHaveBeenCalledWith(
      'image-1',
    );
  });

  it('attempts Cloudinary cleanup when database persistence fails', async () => {
    cloudinaryService.uploadProductImage.mockResolvedValue(upload('image-1'));
    productsRepository.createProductImages.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(
      service.uploadImages('product-1', [file('front.jpg')]),
    ).rejects.toThrow('database unavailable');
    expect(cloudinaryService.destroyProductImage).toHaveBeenCalledWith(
      'image-1',
    );
  });

  it('sets exactly the selected image primary through one transactional repository call', async () => {
    productsRepository.setPrimaryProductImage.mockResolvedValue([
      { ...primaryImage, isPrimary: false },
      { ...secondImage, isPrimary: true },
    ]);

    const result = await service.setPrimaryImage({
      imageId: 'image-2',
      productId: 'product-1',
    });

    expect(productsRepository.setPrimaryProductImage).toHaveBeenCalledTimes(1);
    expect(result.filter((image) => image.isPrimary)).toEqual([
      expect.objectContaining({ id: 'image-2' }),
    ]);
  });

  it('rejects setting a foreign or unknown image primary', async () => {
    productsRepository.setPrimaryProductImage.mockRejectedValue(
      new ProductImageNotFoundError(),
    );

    await expect(
      service.setPrimaryImage({
        imageId: 'foreign-image',
        productId: 'product-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate IDs before starting a reorder transaction', async () => {
    await expect(
      service.reorderImages({
        imageIds: ['image-1', 'image-1'],
        productId: 'product-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(productsRepository.reorderProductImages).not.toHaveBeenCalled();
  });

  it('rejects incomplete or foreign image order data', async () => {
    productsRepository.reorderProductImages.mockRejectedValue(
      new ProductImageOrderError(),
    );

    await expect(
      service.reorderImages({
        imageIds: ['image-1', 'foreign-image'],
        productId: 'product-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns deterministic order from the transactional reorder operation', async () => {
    productsRepository.reorderProductImages.mockResolvedValue([
      { ...secondImage, sortOrder: 0 },
      { ...primaryImage, sortOrder: 1 },
    ]);

    const result = await service.reorderImages({
      imageIds: ['image-2', 'image-1'],
      productId: 'product-1',
    });

    expect(result.map((image) => image.id)).toEqual(['image-2', 'image-1']);
    expect(productsRepository.reorderProductImages).toHaveBeenCalledTimes(1);
  });

  it('deletes a Cloudinary-managed asset before its metadata', async () => {
    productsRepository.findProductImageForManagement.mockResolvedValue(
      secondImage,
    );
    productsRepository.deleteProductImageMetadata.mockResolvedValue([
      primaryImage,
    ]);

    await service.deleteImage({
      imageId: 'image-2',
      productId: 'product-1',
    });

    expect(cloudinaryService.destroyProductImage).toHaveBeenCalledWith(
      secondImage.publicId,
    );
    expect(productsRepository.deleteProductImageMetadata).toHaveBeenCalled();
  });

  it('deletes legacy metadata without calling Cloudinary when publicId is null', async () => {
    productsRepository.findProductImageForManagement.mockResolvedValue({
      ...secondImage,
      publicId: null,
    });
    productsRepository.deleteProductImageMetadata.mockResolvedValue([
      primaryImage,
    ]);

    await service.deleteImage({
      imageId: 'image-2',
      productId: 'product-1',
    });

    expect(cloudinaryService.destroyProductImage).not.toHaveBeenCalled();
  });

  it('returns deterministic primary promotion after deleting the primary image', async () => {
    productsRepository.findProductImageForManagement.mockResolvedValue(
      primaryImage,
    );
    productsRepository.deleteProductImageMetadata.mockResolvedValue([
      { ...secondImage, isPrimary: true, sortOrder: 0 },
    ]);

    const result = await service.deleteImage({
      imageId: 'image-1',
      productId: 'product-1',
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'image-2',
        isPrimary: true,
        sortOrder: 0,
      }),
    ]);
  });

  it('returns an empty image state after deleting the last image', async () => {
    productsRepository.findProductImageForManagement.mockResolvedValue(
      primaryImage,
    );
    productsRepository.deleteProductImageMetadata.mockResolvedValue([]);

    await expect(
      service.deleteImage({
        imageId: 'image-1',
        productId: 'product-1',
      }),
    ).resolves.toEqual([]);
  });
});
