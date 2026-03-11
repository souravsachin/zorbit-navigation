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
import { RouteService } from '../services/route.service';
import { CreateRouteDto } from '../models/dto/create-route.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { Route } from '../models/entities/route.entity';

/**
 * Route registration endpoints, scoped to an organization namespace.
 */
@Controller('api/v1/O/:orgId/navigation/routes')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  /**
   * GET /api/v1/O/:orgId/navigation/routes
   * List all registered routes for an organization.
   */
  @Get()
  async findAll(@Param('orgId') orgId: string): Promise<Route[]> {
    return this.routeService.findAllByOrganization(orgId);
  }

  /**
   * POST /api/v1/O/:orgId/navigation/routes
   * Register a new route for an organization.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateRouteDto,
  ): Promise<Route> {
    return this.routeService.create(orgId, dto);
  }

  /**
   * DELETE /api/v1/O/:orgId/navigation/routes/:routeId
   * Remove a registered route.
   */
  @Delete(':routeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('orgId') orgId: string,
    @Param('routeId') routeId: string,
  ): Promise<void> {
    return this.routeService.remove(orgId, routeId);
  }
}
