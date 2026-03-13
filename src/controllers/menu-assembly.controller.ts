import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { MenuAssemblyService, AssembledMenu } from '../services/menu-assembly.service';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

/**
 * Assembled menu endpoint, scoped to a user namespace.
 * Returns the user's privilege-based navigation menu with
 * handlebars-templated routes resolved for their org/user context.
 */
@ApiTags('menu-assembly')
@ApiBearerAuth()
@Controller('api/v1/U/:userId/menu')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class MenuAssemblyController {
  constructor(private readonly menuAssemblyService: MenuAssemblyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get assembled menu',
    description:
      'Assembles the navigation menu for a user based on their privilege mappings. ' +
      'Routes are resolved with handlebars templating using the user and org context. ' +
      'Supports database, static, and fallback menu sources (configurable via MENU_SOURCE env var).',
  })
  @ApiParam({
    name: 'userId',
    description: 'User short hash ID',
    example: 'U-81F3',
  })
  @ApiQuery({
    name: 'org',
    description: 'Organization short hash ID (overrides JWT org claim)',
    required: false,
    example: 'O-92AF',
  })
  @ApiResponse({ status: 200, description: 'Assembled menu returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT.' })
  @ApiResponse({ status: 403, description: 'Forbidden — namespace mismatch.' })
  async getAssembledMenu(
    @Param('userId') userId: string,
    @Query('org') orgQueryParam: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AssembledMenu> {
    const user = req.user as JwtPayload;
    const orgId = orgQueryParam || user.org;

    // Extract the bearer token to forward to the authorization service
    const authHeader = req.headers.authorization || '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '');

    const menu = await this.menuAssemblyService.assembleMenu(
      userId,
      orgId,
      authToken,
    );

    // Set response header indicating the menu source
    res.setHeader('X-Zorbit-Menu-Source', menu.source);

    return menu;
  }

  @Post('seed')
  @ApiOperation({
    summary: 'Seed menu items from static config',
    description:
      'Populates the menu_items table from the bundled menuConfig.json. ' +
      'Idempotent — skips items that already exist.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User short hash ID (must be admin)',
    example: 'U-81F3',
  })
  @ApiQuery({
    name: 'org',
    description: 'Organization short hash ID to seed menu for',
    required: false,
    example: 'O-92AF',
  })
  @ApiResponse({ status: 201, description: 'Menu items seeded.' })
  async seedMenu(
    @Param('userId') _userId: string,
    @Query('org') orgQueryParam: string | undefined,
    @Req() req: Request,
  ): Promise<{ created: number; skipped: number }> {
    const user = req.user as JwtPayload;
    const orgId = orgQueryParam || user.org;
    return this.menuAssemblyService.seedFromStatic(orgId);
  }
}
