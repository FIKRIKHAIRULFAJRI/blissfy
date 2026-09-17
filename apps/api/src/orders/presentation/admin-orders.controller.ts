import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { AdminOrdersService } from '../application/admin-orders.service';

@ApiTags('Admin Orders')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders for admin' })
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('fulfillmentStatus') fulfillmentStatus?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.listOrders({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      paymentStatus,
      fulfillmentStatus,
      search,
      fromDate,
      toDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async getById(@Param('id') id: string) {
    const order = await this.service.getOrderById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Patch(':id/fulfillment-status')
  @ApiOperation({ summary: 'Update order fulfillment status' })
  async updateFulfillmentStatus(
    @Param('id') id: string,
    @Body() body: { fulfillmentStatus: string },
  ) {
    const order = await this.service.updateFulfillmentStatus(
      id,
      body.fulfillmentStatus,
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update shipment tracking number' })
  async updateTracking(
    @Param('id') id: string,
    @Body() body: { trackingNumber: string },
  ) {
    const shipment = await this.service.updateTrackingNumber(
      id,
      body.trackingNumber,
    );
    if (!shipment) {
      throw new NotFoundException('Order or shipment not found');
    }
    return shipment;
  }
}
