import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { AdminFlashSalesService } from '../application/admin-flash-sales.service';

@UseGuards(AdminSessionGuard)
@Controller('v1/admin/flash-sales')
export class AdminFlashSalesController {
  constructor(private readonly service: AdminFlashSalesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
