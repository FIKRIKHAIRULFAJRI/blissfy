import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CloudinaryService } from '../infrastructure/cloudinary.service';

class GenerateSignatureDto {
  folder?: string;
}

class SignatureResponseDto {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

@ApiTags('uploads')
@Controller('v1/admin/uploads')
export class UploadsController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Cloudinary upload signature' })
  @ApiResponse({
    status: 200,
    description: 'Signature generated successfully',
    type: SignatureResponseDto,
  })
  generateSignature(
    @Body() dto: GenerateSignatureDto,
  ): SignatureResponseDto {
    const folder = dto.folder || 'blissfy/products';
    
    // TODO: Add admin authentication guard
    // @UseGuards(AdminSessionGuard)
    
    const result = this.cloudinaryService.generateUploadSignature(folder);
    
    return {
      signature: result.signature,
      timestamp: result.timestamp,
      cloudName: result.cloudName,
      apiKey: result.apiKey,
      folder: result.folder,
    };
  }
}
