import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  PaymentServiceError,
  PaymentsService,
} from '../application/payments.service';

@ApiTags('Payments')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':accessToken/charge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or retrieve QRIS payment',
  })
  @ApiParam({
    name: 'accessToken',
    type: 'string',
    description: 'Public payment access token from order creation.',
  })
  @ApiOkResponse({
    description: 'QRIS payment created or existing payment returned.',
  })
  @ApiNotFoundResponse({
    description: 'Payment access token was not found.',
  })
  @ApiResponse({
    status: 503,
    description: 'Payment gateway temporarily unavailable.',
  })
  async charge(
    @Param('accessToken')
    accessToken: string,
  ) {
    try {
      const payment =
        await this.paymentsService.createOrGetQrisPayment(accessToken);

      return {
        ok: true,
        payment,
      };
    } catch (error) {
      handlePaymentError(
        error,
        'PAYMENT_CHARGE_FAILED',
        'QRIS belum dapat dibuat. Coba lagi.',
      );
    }
  }

  @Get(':accessToken/status')
  @ApiOperation({
    summary: 'Get public payment status',
  })
  @ApiParam({
    name: 'accessToken',
    type: 'string',
    description: 'Public payment access token from order creation.',
  })
  @ApiOkResponse({
    description: 'Current public payment state.',
  })
  @ApiNotFoundResponse({
    description: 'Payment access token was not found.',
  })
  @ApiResponse({
    status: 503,
    description: 'Payment status temporarily unavailable.',
  })
  async status(
    @Param('accessToken')
    accessToken: string,
  ) {
    try {
      const payment =
        await this.paymentsService.getPublicPaymentStateByToken(accessToken);

      return {
        ok: true,
        payment,
      };
    } catch (error) {
      handlePaymentError(
        error,
        'PAYMENT_STATUS_FAILED',
        'Status pembayaran belum dapat diperiksa. Coba lagi.',
      );
    }
  }
}

function handlePaymentError(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): never {
  if (error instanceof PaymentServiceError) {
    throw new HttpException(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },

      error.status,
    );
  }

  console.error('Payment request failed', {
    name: error instanceof Error ? error.name : 'UnknownError',
  });

  throw new HttpException(
    {
      ok: false,
      code: fallbackCode,
      message: fallbackMessage,
    },

    HttpStatus.SERVICE_UNAVAILABLE,
  );
}
