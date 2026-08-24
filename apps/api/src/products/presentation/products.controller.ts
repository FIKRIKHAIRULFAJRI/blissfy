import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../application/products.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

@ApiTags('Products')
@Controller('v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get active catalog products',
  })
  @ApiResponse({
    status: 200,
    description: 'Active products retrieved successfully.',
  })
  async getProducts(@Query() query: ListProductsQueryDto) {
    return this.productsService.getCatalogProducts(query.limit);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get active product by slug',
  })
  @ApiParam({
    name: 'slug',
    example: 'the-signature-blouse',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
  })
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.getProductBySlug(slug);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }
}
