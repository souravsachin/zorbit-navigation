import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RouteService } from '../services/route.service';
import { CreateRouteDto } from '../models/dto/create-route.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { Route } from '../models/entities/route.entity';

/**
 * Route registration endpoints, scoped to an organization namespace.
 */
@ApiTags('routes')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId/navigation/routes')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  @ApiOperation({ summary: 'List routes', description: 'List all registered routes for an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'List of routes returned.' })
  async findAll(@Param('orgId') orgId: string): Promise<Route[]> {
    return this.routeService.findAllByOrganization(orgId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register route', description: 'Register a new route for an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Route registered successfully.' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateRouteDto,
  ): Promise<Route> {
    return this.routeService.create(orgId, dto);
  }

  @Delete(':routeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove route', description: 'Remove a registered route.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'routeId', description: 'Route short hash ID', example: 'RTE-92AF' })
  @ApiResponse({ status: 204, description: 'Route removed successfully.' })
  @ApiResponse({ status: 404, description: 'Route not found.' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('routeId') routeId: string,
  ): Promise<void> {
    return this.routeService.remove(orgId, routeId);
  }
}
