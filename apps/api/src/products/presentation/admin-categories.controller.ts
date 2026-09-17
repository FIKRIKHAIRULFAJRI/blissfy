import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { AdminCategoriesService } from '../application/admin-categories.service';
import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';

@ApiTags('Admin Categories')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: AdminCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories for Admin management' })
  async listCategories() {
    return { categories: await this.categoriesService.listCategories() };
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  async createCategory(@Body() body: CreateAdminCategoryDto) {
    return { category: await this.categoriesService.createCategory(body) };
  }

  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateAdminCategoryDto,
  ) {
    return {
      category: await this.categoriesService.updateCategory(categoryId, body),
    };
  }

  @Delete(':categoryId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an unused category' })
  async deleteCategory(@Param('categoryId') categoryId: string): Promise<void> {
    await this.categoriesService.deleteCategory(categoryId);
  }
}
