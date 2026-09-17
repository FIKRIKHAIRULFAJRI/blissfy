import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { HomepageService } from '../application/homepage.service';

@ApiTags('Admin Homepage')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/homepage')
export class AdminHomepageController {
  constructor(private readonly service: HomepageService) {}

  @Get('sections')
  getSections() { return this.service.getSections(); }

  @Patch('sections/:id')
  updateSection(@Param('id') id: string, @Body() body: any) { return this.service.updateSection(id, body); }

  @Get('banners')
  getBanners() { return this.service.getBanners(); }

  @Post('banners')
  createBanner(@Body() body: any) { return this.service.createBanner(body); }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) { return this.service.deleteBanner(id); }
}
