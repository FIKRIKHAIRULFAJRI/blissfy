import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @ApiOperation({
    summary: 'Check API health',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running normally.',
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'blissfy-api',
    };
  }

  @Get('database')
  @ApiOperation({
    summary: 'Check database connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'Database connection is healthy.',
  })
  async getDatabaseHealth() {
    await this.databaseService.ping();

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}
