import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { NavigationResolverService } from '../services/navigation-resolver.service';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';
import { MenuItem } from '../models/entities/menu-item.entity';

/**
 * Resolved navigation endpoint, scoped to a user namespace.
 * Returns the user's menu tree filtered by their privileges.
 */
@ApiTags('navigation-resolver')
@ApiBearerAuth()
@Controller('api/v1/U/:userId/navigation')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class NavigationResolverController {
  constructor(private readonly navigationResolverService: NavigationResolverService) {}

  @Get('resolved')
  @ApiOperation({ summary: 'Get resolved navigation', description: 'Get the resolved menu for a user based on their privileges. The orgId is extracted from the JWT claims.' })
  @ApiParam({ name: 'userId', description: 'User short hash ID', example: 'U-81F3' })
  @ApiResponse({ status: 200, description: 'Resolved navigation menu returned.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getResolvedMenu(
    @Param('userId') userId: string,
    @Req() req: Request,
  ): Promise<{ menu: MenuItem[] }> {
    const user = req.user as JwtPayload;
    const menu = await this.navigationResolverService.resolveForUser(userId, user.org);
    return { menu };
  }
}
