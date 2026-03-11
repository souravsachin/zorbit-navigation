import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenuService } from '../services/menu.service';
import { CreateMenuItemDto } from '../models/dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../models/dto/update-menu-item.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { MenuItem } from '../models/entities/menu-item.entity';

/**
 * Menu management endpoints, scoped to an organization namespace.
 * All routes enforce namespace isolation via orgId.
 */
@Controller('api/v1/O/:orgId/navigation/menus')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * GET /api/v1/O/:orgId/navigation/menus
   * List all top-level menu items for an organization.
   */
  @Get()
  async findAll(@Param('orgId') orgId: string): Promise<MenuItem[]> {
    return this.menuService.findAllByOrganization(orgId);
  }

  /**
   * POST /api/v1/O/:orgId/navigation/menus
   * Create a new menu item in an organization.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuService.create(orgId, dto);
  }

  /**
   * GET /api/v1/O/:orgId/navigation/menus/:menuId
   * Get a single menu item by hashId.
   */
  @Get(':menuId')
  async findOne(
    @Param('orgId') orgId: string,
    @Param('menuId') menuId: string,
  ): Promise<MenuItem> {
    return this.menuService.findOne(orgId, menuId);
  }

  /**
   * PUT /api/v1/O/:orgId/navigation/menus/:menuId
   * Update a menu item.
   */
  @Put(':menuId')
  async update(
    @Param('orgId') orgId: string,
    @Param('menuId') menuId: string,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuService.update(orgId, menuId, dto);
  }

  /**
   * DELETE /api/v1/O/:orgId/navigation/menus/:menuId
   * Delete a menu item.
   */
  @Delete(':menuId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('orgId') orgId: string,
    @Param('menuId') menuId: string,
  ): Promise<void> {
    return this.menuService.remove(orgId, menuId);
  }
}
