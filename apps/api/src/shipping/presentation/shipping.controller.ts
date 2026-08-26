import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ShippingService } from '../application/shipping.service';

@ApiTags('Shipping')
@Controller('v1/shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('regions')
  @ApiOperation({
    summary: 'Get shipping destination regions',
  })
  @ApiQuery({
    name: 'level',
    enum: ['province', 'city', 'district'],
    required: true,
  })
  @ApiQuery({
    name: 'parentId',
    required: false,
  })
  @ApiOkResponse({
    description: 'Shipping regions loaded.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid region query.',
  })
  getRegions(
    @Query('level')
    level?: string,

    @Query('parentId')
    parentId?: string,
  ) {
    return this.shippingService.getRegions({
      level,
      parentId,
    });
  }

  @Post('rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate authoritative shipping rates',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['destinationDistrictId', 'items'],
      properties: {
        destinationDistrictId: {
          type: 'string',
        },
        destination: {
          type: 'object',
          properties: {
            provinceId: {
              type: 'string',
            },
            provinceName: {
              type: 'string',
            },
            cityId: {
              type: 'string',
            },
            cityName: {
              type: 'string',
            },
            districtId: {
              type: 'string',
            },
            districtName: {
              type: 'string',
            },
          },
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['productId', 'variantId', 'quantity'],
            properties: {
              productId: {
                type: 'string',
              },
              variantId: {
                type: 'string',
              },
              quantity: {
                type: 'integer',
                minimum: 1,
                maximum: 99,
              },
              normalPrice: {
                type: 'integer',
              },
              salePrice: {
                type: 'integer',
              },
              stock: {
                type: 'integer',
              },
            },
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Shipping rates calculated.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid cart or destination.',
  })
  getRates(@Body() body: unknown) {
    return this.shippingService.getRates(body);
  }
}
