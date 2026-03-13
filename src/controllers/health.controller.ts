import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('api/v1/G/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns service health status. No authentication required.' })
  @ApiResponse({ status: 200, description: 'Service is healthy.' })
  check() {
    return {
      status: 'ok',
      service: 'zorbit-navigation',
      timestamp: new Date().toISOString(),
    };
  }
}
