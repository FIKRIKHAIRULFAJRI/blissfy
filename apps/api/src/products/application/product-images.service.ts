import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminProductImage,
  CloudinaryProductImageUpload,
} from '../domain/admin-product-image.types';
import {
  detectProductImageMimeType,
  isAllowedProductImageMimeType,
  PRODUCT_IMAGE_MAX_COUNT,
  PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,
} from '../domain/product-image.constants';
import { CloudinaryService } from '../infrastructure/cloudinary.service';
import {
  ProductImageLimitError,
  ProductImageNotFoundError,
  ProductImageOrderError,
  ProductNotFoundError,
  ProductsRepository,
  type ImageRow,
} from '../infrastructure/products.repository';

@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async listImages(productId: string): Promise<AdminProductImage[]> {
    await this.getProductOrThrow(productId);
    const images = await this.productsRepository.listProductImages(productId);

    return images.map((image) => this.toAdminImage(image));
  }

  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<AdminProductImage[]> {
    if (files.length === 0) {
      throw new BadRequestException('Select at least one product image.');
    }

    if (files.length > PRODUCT_IMAGE_MAX_COUNT) {
      throw new BadRequestException(
        `A product can have at most ${PRODUCT_IMAGE_MAX_COUNT} images.`,
      );
    }

    for (const file of files) {
      this.validateFile(file);
    }

    const product = await this.getProductOrThrow(productId);
    const currentImageCount =
      await this.productsRepository.countProductImages(productId);

    if (currentImageCount + files.length > PRODUCT_IMAGE_MAX_COUNT) {
      throw new BadRequestException(
        `A product can have at most ${PRODUCT_IMAGE_MAX_COUNT} images.`,
      );
    }

    const uploads: CloudinaryProductImageUpload[] = [];

    try {
      for (const file of files) {
        uploads.push(
          await this.cloudinaryService.uploadProductImage({
            buffer: file.buffer,
            productId,
          }),
        );
      }
    } catch (error) {
      await this.cleanupUploadedAssets(uploads);
      throw error;
    }

    try {
      const images = await this.productsRepository.createProductImages({
        altText: product.name,
        maxImages: PRODUCT_IMAGE_MAX_COUNT,
        productId,
        uploads,
      });

      return images.map((image) => this.toAdminImage(image));
    } catch (error) {
      await this.cleanupUploadedAssets(uploads);

      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException('Product not found.');
      }

      if (error instanceof ProductImageLimitError) {
        throw new BadRequestException(
          `A product can have at most ${PRODUCT_IMAGE_MAX_COUNT} images.`,
        );
      }

      throw error;
    }
  }

  async setPrimaryImage({
    imageId,
    productId,
  }: {
    imageId: string;
    productId: string;
  }): Promise<AdminProductImage[]> {
    await this.getProductOrThrow(productId);

    try {
      const images = await this.productsRepository.setPrimaryProductImage({
        imageId,
        productId,
      });

      return images.map((image) => this.toAdminImage(image));
    } catch (error) {
      if (error instanceof ProductImageNotFoundError) {
        throw new NotFoundException('Product image not found.');
      }

      throw error;
    }
  }

  async reorderImages({
    imageIds,
    productId,
  }: {
    imageIds: string[];
    productId: string;
  }): Promise<AdminProductImage[]> {
    await this.getProductOrThrow(productId);

    if (new Set(imageIds).size !== imageIds.length) {
      throw new BadRequestException('Image order contains duplicate IDs.');
    }

    try {
      const images = await this.productsRepository.reorderProductImages({
        imageIds,
        productId,
      });

      return images.map((image) => this.toAdminImage(image));
    } catch (error) {
      if (error instanceof ProductImageOrderError) {
        throw new BadRequestException(
          'Image order must contain every image for this product exactly once.',
        );
      }

      throw error;
    }
  }

  async deleteImage({
    imageId,
    productId,
  }: {
    imageId: string;
    productId: string;
  }): Promise<AdminProductImage[]> {
    await this.getProductOrThrow(productId);
    const image = await this.productsRepository.findProductImageForManagement({
      imageId,
      productId,
    });

    if (!image) {
      throw new NotFoundException('Product image not found.');
    }

    if (image.publicId) {
      await this.cloudinaryService.destroyProductImage(image.publicId);
    }

    try {
      const images = await this.productsRepository.deleteProductImageMetadata({
        imageId,
        productId,
      });

      return images.map((remainingImage) => this.toAdminImage(remainingImage));
    } catch (error) {
      if (error instanceof ProductImageNotFoundError) {
        throw new NotFoundException('Product image not found.');
      }

      if (image.publicId) {
        this.logger.error(
          'Product image metadata deletion failed after provider cleanup.',
        );
      }
      throw error;
    }
  }

  private async getProductOrThrow(productId: string) {
    const product =
      await this.productsRepository.findProductForImageManagement(productId);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!isAllowedProductImageMimeType(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported image type. Use JPEG, PNG, or WebP.',
      );
    }

    if (file.size > PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Each image must be at most ${PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES / 1024 / 1024} MiB.`,
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded image is empty.');
    }

    if (detectProductImageMimeType(file.buffer) !== file.mimetype) {
      throw new BadRequestException(
        'Image content does not match its declared JPEG, PNG, or WebP type.',
      );
    }
  }

  private async cleanupUploadedAssets(
    uploads: CloudinaryProductImageUpload[],
  ): Promise<void> {
    const results = await Promise.allSettled(
      uploads.map((upload) =>
        this.cloudinaryService.destroyProductImage(upload.publicId),
      ),
    );
    const failedCleanupCount = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    if (failedCleanupCount > 0) {
      this.logger.error(
        `Cloudinary compensation could not clean up ${failedCleanupCount} uploaded product image(s).`,
      );
    }
  }

  private toAdminImage(image: ImageRow): AdminProductImage {
    return {
      id: image.id,
      url: image.url,
      altText: image.altText?.trim() || 'Product image',
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    };
  }
}
