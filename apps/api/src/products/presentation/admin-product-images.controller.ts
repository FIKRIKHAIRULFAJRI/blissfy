import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { ProductImagesService } from '../application/product-images.service';
import {
  isAllowedProductImageMimeType,
  PRODUCT_IMAGE_MAX_COUNT,
  PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,
} from '../domain/product-image.constants';
import { ReorderProductImagesDto } from './dto/reorder-product-images.dto';

@ApiTags('Admin Product Images')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/products/:productId/images')
export class AdminProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Get()
  @ApiOperation({ summary: 'List product images for Admin management' })
  async listImages(@Param('productId') productId: string) {
    return {
      images: await this.productImagesService.listImages(productId),
    };
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product images to Cloudinary' })
  @UseInterceptors(
    FilesInterceptor('files', PRODUCT_IMAGE_MAX_COUNT, {
      limits: {
        fileSize: PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,
        files: PRODUCT_IMAGE_MAX_COUNT,
      },
      fileFilter: (_request, file, callback) => {
        if (!isAllowedProductImageMimeType(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported image type. Use JPEG, PNG, or WebP.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadImages(
    @Param('productId') productId: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return {
      images: await this.productImagesService.uploadImages(productId, files),
    };
  }

  @Patch('order')
  @ApiOperation({ summary: 'Set the complete product image order' })
  async reorderImages(
    @Param('productId') productId: string,
    @Body() body: ReorderProductImagesDto,
  ) {
    return {
      images: await this.productImagesService.reorderImages({
        imageIds: body.imageIds,
        productId,
      }),
    };
  }

  @Patch(':imageId/primary')
  @ApiOperation({ summary: 'Set one product image as primary' })
  async setPrimaryImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return {
      images: await this.productImagesService.setPrimaryImage({
        imageId,
        productId,
      }),
    };
  }

  @Delete(':imageId')
  @ApiOperation({ summary: 'Delete a product image' })
  async deleteImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return {
      images: await this.productImagesService.deleteImage({
        imageId,
        productId,
      }),
    };
  }
}
