import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  it('does not fail application boot when optional credentials are missing', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };
    const service = new CloudinaryService(
      configService as unknown as ConfigService,
    );

    expect(service.isConfigured()).toBe(false);
  });

  it('returns a clear server-side error when upload is attempted unconfigured', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };
    const service = new CloudinaryService(
      configService as unknown as ConfigService,
    );

    await expect(
      service.uploadProductImage({
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
        productId: 'product-1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
