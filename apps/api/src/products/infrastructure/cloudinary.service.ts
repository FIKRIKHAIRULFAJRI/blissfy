import { randomUUID } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
import type { CloudinaryProductImageUpload } from '../domain/admin-product-image.types';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return this.getConfiguration() !== null;
  }

  async uploadProductImage({
    buffer,
    productId,
  }: {
    buffer: Buffer;
    productId: string;
  }): Promise<CloudinaryProductImageUpload> {
    this.configureOrThrow();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `blissfy/products/${productId}`,
          public_id: randomUUID(),
          overwrite: false,
          resource_type: 'image',
          secure: true,
          unique_filename: false,
          use_filename: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(
              new ServiceUnavailableException(
                'Cloudinary image upload failed. Please try again.',
              ),
            );
            return;
          }

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      stream.end(buffer);
    });
  }

  async destroyProductImage(publicId: string): Promise<void> {
    this.configureOrThrow();

    try {
      const result: unknown = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: 'image',
      });

      if (
        !this.isDestroyResult(result) ||
        (result.result !== 'ok' && result.result !== 'not found')
      ) {
        throw new Error('Cloudinary destroy returned an unexpected result.');
      }
    } catch {
      throw new ServiceUnavailableException(
        'Cloudinary image deletion failed. Please try again.',
      );
    }
  }

  private configureOrThrow(): void {
    const configuration = this.getConfiguration();

    if (!configuration) {
      throw new ServiceUnavailableException(
        'Cloudinary image management is not configured on the server.',
      );
    }

    cloudinary.config({
      ...configuration,
      secure: true,
    });
  }

  private getConfiguration(): {
    cloud_name: string;
    api_key: string;
    api_secret: string;
  } | null {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  }

  private isDestroyResult(value: unknown): value is { result: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'result' in value &&
      typeof value.result === 'string'
    );
  }
}
