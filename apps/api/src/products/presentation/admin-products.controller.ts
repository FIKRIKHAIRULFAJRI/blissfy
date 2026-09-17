import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { AdminProductsService } from '../application/admin-products.service';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';

@ApiTags('Admin Products')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/products')
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}
  @Get() list(@Query('page') page = '1', @Query('q') q?: string, @Query('status') status?: string) {
    return this.service.listProducts({ page: Math.max(Number(page) || 1, 1), q, status: status === 'active' ? true : status === 'inactive' ? false : undefined });
  }
  @Get(':id') get(@Param('id') id: string) { return this.service.getProduct(id); }
  @Post() create(@Body() body: CreateAdminProductDto) { return this.service.createProduct(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: UpdateAdminProductDto) { return this.service.updateProduct(id, body); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) { return this.service.updateProductStatus(id, isActive); }
  @Delete(':id') @HttpCode(204) async delete(@Param('id') id: string): Promise<void> { await this.service.deleteProduct(id); }
}
