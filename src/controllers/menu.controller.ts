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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MenuService } from '../services/menu.service';
import { CreateMenuItemDto } from '../models/dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../models/dto/update-menu-item.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { MenuItem } from '../models/entities/menu-item.entity';

/**
 * Menu management endpoints, scoped to an organization namespace.
 */
@ApiTags('menus')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId/navigation/menus')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List menu items', description: 'List all top-level menu items for an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'List of menu items returned.' })
  async findAll(@Param('orgId') orgId: string): Promise<MenuItem[]> {
    return this.menuService.findAllByOrganization(orgId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create menu item', description: 'Create a new menu item in an organization.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Menu item created successfully.' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuService.create(orgId, dto);
  }

  @Get(':menuId')
  @ApiOperation({ summary: 'Get menu item', description: 'Get a single menu item by hashId.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'menuId', description: 'Menu item short hash ID', example: 'NAV-81F3' })
  @ApiResponse({ status: 200, description: 'Menu item returned.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async findOne(
    @Param('orgId') orgId: string,
    @Param('menuId') menuId: string,
  ): Promise<MenuItem> {
    return this.menuService.findOne(orgId, menuId);
  }

  @Put(':menuId')
  @ApiOperation({ summary: 'Update menu item', description: 'Update a menu item.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'menuId', description: 'Menu item short hash ID', example: 'NAV-81F3' })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async update(
    @Param('orgId') orgId: string,
    @Param('menuId') menuId: string,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuService.update(orgId, menuId, dto);
  }

  @Delete(':menuId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete menu item', description: 'Delete a menu item.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'menuId', description: 'Menu item short hash ID', example: 'NAV-81F3' })
  @ApiResponse({ status: 204, description: 'Menu item deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('menuId') menuId: string,
  ): Promise<void> {
    return this.menuService.remove(orgId, menuId);
  }
}
