import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({ description: 'Route identifier path', example: '/customers' })
  @IsString()
  @IsNotEmpty()
  path!: string;

  @ApiProperty({ description: 'Frontend route path', example: '/app/customers' })
  @IsString()
  @IsNotEmpty()
  frontendPath!: string;

  @ApiProperty({ description: 'Backend API path', example: '/api/v1/O/:orgId/customers' })
  @IsString()
  @IsNotEmpty()
  backendPath!: string;

  @ApiPropertyOptional({ description: 'HTTP method', example: 'GET', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] })
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({ description: 'Required privilege code', example: 'customers.read' })
  @IsString()
  @IsOptional()
  privilegeCode?: string;
}
