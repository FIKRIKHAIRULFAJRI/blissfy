import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckoutService } from '../application/checkout.service';

@ApiTags('Checkout')
@Controller('v1/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate current cart price and stock',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          maxItems: 50,
          items: {
            type: 'object',
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
                minimum: 0,
              },
              salePrice: {
                type: 'integer',
                minimum: 0,
              },
              stock: {
                type: 'integer',
                minimum: 0,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cart validation completed.',
  })
  @ApiResponse({
    status: 400,
    description: 'Cart validation payload is invalid.',
  })
  async validateCart(@Body() body: unknown) {
    return this.checkoutService.validateCart(body);
  }
}
