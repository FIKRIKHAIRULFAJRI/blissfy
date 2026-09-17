import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { AdminVouchersService } from '../application/admin-vouchers.service';

@ApiTags('Admin Vouchers')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/vouchers')
export class AdminVouchersController {
  constructor(private readonly service: AdminVouchersService) {}

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
