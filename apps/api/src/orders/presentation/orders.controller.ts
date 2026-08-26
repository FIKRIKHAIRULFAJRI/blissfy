import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { OrderMaintenanceService } from '../application/order-maintenance.service';
import { OrdersService } from '../application/orders.service';

const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 10;

const orderRateLimit = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

@ApiTags('Orders')
@Controller('v1/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderMaintenanceService: OrderMaintenanceService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create order and reserve stock',
  })
  @ApiBody({
    schema: {
      type: 'object',

      required: [
        'idempotencyKey',
        'items',
        'recipient',
        'shippingQuoteId',
        'destination',
        'termsAccepted',
      ],

      properties: {
        idempotencyKey: {
          type: 'string',
          minLength: 16,
          maxLength: 120,
        },

        items: {
          type: 'array',
          minItems: 1,
          maxItems: 50,

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
            },
          },
        },

        recipient: {
          type: 'object',

          required: [
            'recipientName',
            'whatsapp',
            'email',
            'province',
            'city',
            'district',
            'postalCode',
            'address',
          ],

          properties: {
            recipientName: {
              type: 'string',
            },

            whatsapp: {
              type: 'string',
            },

            email: {
              type: 'string',
              format: 'email',
            },

            province: {
              type: 'string',
            },

            city: {
              type: 'string',
            },

            district: {
              type: 'string',
            },

            postalCode: {
              type: 'string',
              example: '53147',
            },

            address: {
              type: 'string',
            },
          },
        },

        orderNote: {
          type: 'string',
          maxLength: 500,
        },

        shippingQuoteId: {
          type: 'string',
        },

        destination: {
          type: 'object',

          required: [
            'provinceId',
            'provinceName',
            'cityId',
            'cityName',
            'districtId',
            'districtName',
          ],

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

        termsAccepted: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Order created or idempotently replayed.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid checkout payload.',
  })
  @ApiConflictResponse({
    description: 'Stock, shipping quote, or idempotency conflict.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many order creation attempts.',
  })
  @ApiResponse({
    status: 503,
    description: 'Order service temporarily unavailable.',
  })
  create(
    @Body()
    body: unknown,

    @Headers('x-forwarded-for')
    forwardedFor?: string,

    @Headers('x-real-ip')
    realIp?: string,
  ) {
    const clientIp = getClientIp(forwardedFor, realIp);

    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      throw new HttpException(
        {
          ok: false,
          code: 'ORDER_RATE_LIMITED',
          message: 'Terlalu banyak percobaan checkout. Coba lagi sebentar.',
        },

        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.ordersService.create(body);
  }

  @Post('release-expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release expired stock reservations',
  })
  @ApiHeader({
    name: 'x-cron-secret',
    required: true,
    description: 'Internal secret for scheduled maintenance.',
  })
  @ApiOkResponse({
    description: 'Expired stock reservations released successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid cron secret.',
  })
  @ApiResponse({
    status: 503,
    description: 'Cron configuration or reservation maintenance unavailable.',
  })
  releaseExpired(
    @Headers('x-cron-secret')
    cronSecret?: string,
  ) {
    const configuredSecret = this.configService.get<string>('CRON_SECRET');

    if (!configuredSecret) {
      throw new HttpException(
        {
          ok: false,
          code: 'CRON_NOT_CONFIGURED',
          message: 'Secret maintenance belum dikonfigurasi.',
        },

        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!cronSecret || cronSecret !== configuredSecret) {
      throw new HttpException(
        {
          ok: false,
          code: 'CRON_UNAUTHORIZED',
          message: 'Tidak diizinkan.',
        },

        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.orderMaintenanceService.releaseExpiredReservations();
  }
}

function getClientIp(forwardedFor?: string, realIp?: string) {
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}

function checkRateLimit(key: string) {
  const now = Date.now();

  const current = orderRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    orderRateLimit.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });

    return {
      allowed: true,
    };
  }

  if (current.count >= rateLimitMaxRequests) {
    return {
      allowed: false,
    };
  }

  current.count += 1;

  return {
    allowed: true,
  };
}
