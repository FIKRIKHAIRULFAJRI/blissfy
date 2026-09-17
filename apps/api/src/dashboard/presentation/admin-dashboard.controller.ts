import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../auth/admin-session.guard';
import { AdminDashboardService } from '../application/admin-dashboard.service';

@ApiTags('Admin Dashboard')
@UseGuards(AdminSessionGuard)
@Controller('v1/admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary metrics' })
  getSummary() {
    return this.service.getSummary();
  }
}
