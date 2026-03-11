import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MenuService } from './menu.service';
import { MenuItem } from '../models/entities/menu-item.entity';

/**
 * Resolves the navigation menu for a specific user.
 * Calls the authorization service to get the user's privileges,
 * then filters menu items accordingly.
 */
@Injectable()
export class NavigationResolverService {
  private readonly logger = new Logger(NavigationResolverService.name);
  private readonly authorizationServiceUrl: string;

  constructor(
    private readonly menuService: MenuService,
    private readonly configService: ConfigService,
  ) {
    this.authorizationServiceUrl = this.configService.get<string>(
      'AUTHORIZATION_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  /**
   * Resolve the full navigation menu for a user.
   * 1. Fetch the user's privilege codes from the authorization service.
   * 2. Filter menu items to only include those the user has access to.
   * 3. Return the menu tree.
   */
  async resolveForUser(userId: string, orgId: string): Promise<MenuItem[]> {
    const privilegeCodes = await this.fetchUserPrivileges(userId, orgId);
    return this.menuService.resolveMenuTree(orgId, privilegeCodes);
  }

  /**
   * Fetch privilege codes for a user from the authorization service.
   * Falls back to an empty set if the service is unavailable.
   */
  private async fetchUserPrivileges(userId: string, orgId: string): Promise<string[]> {
    const url = `${this.authorizationServiceUrl}/api/v1/O/${orgId}/users/${userId}/privileges`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        this.logger.warn(
          `Authorization service returned ${response.status} for user ${userId} in org ${orgId}`,
        );
        return [];
      }

      const data = (await response.json()) as { privilegeCodes?: string[] };
      return data.privilegeCodes || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch privileges from authorization service for user ${userId}`,
        error,
      );
      // Return empty privileges — user will only see unrestricted menu items
      return [];
    }
  }
}
