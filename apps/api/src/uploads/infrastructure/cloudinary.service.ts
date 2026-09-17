import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinarySignatureParams {
  timestamp: number;
  folder: string;
  upload_preset?: string;
}

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

@Injectable()
export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly uploadPreset?: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.configService.getOrThrow<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET');
    this.uploadPreset = this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET');

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  generateUploadSignature(folder: string = 'blissfy/products'): CloudinarySignatureResult {
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign: CloudinarySignatureParams = {
      timestamp,
      folder,
    };

    if (this.uploadPreset) {
      paramsToSign.upload_preset = this.uploadPreset;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
    };
  }

  async deleteAsset(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
