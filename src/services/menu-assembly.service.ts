import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HandlebarsTemplateService } from './handlebars-template.service';
import { MenuItem } from '../models/entities/menu-item.entity';
import * as staticMenuConfig from '../config/menuConfig.json';

/**
 * Response shape for an assembled menu item within a section.
 */
export interface AssembledMenuItem {
  id: string;
  code: string;
  label: string;
  icon: string;
  route: string | null;
  apiRoute: string | null;
  seq: number;
}

/**
 * Response shape for an assembled menu section.
 */
export interface AssembledSection {
  id: string;
  code: string;
  label: string;
  icon: string;
  seq: number;
  items: AssembledMenuItem[];
}

/**
 * Full assembled menu response.
 */
export interface AssembledMenu {
  sections: AssembledSection[];
  source: 'database' | 'static';
  generatedAt: string;
}

/**
 * Cache entry with TTL tracking.
 */
interface CacheEntry {
  menu: AssembledMenu;
  expiresAt: number;
}

/**
 * Assembles the navigation menu for a user by:
 * 1. Reading menu items from the navigation service's own database
 * 2. Grouping items by section
 * 3. Applying handlebars templating to route configs
 * 4. Returning the assembled menu.json
 *
 * Supports three modes via MENU_SOURCE env var:
 *   - "database"  — always read from local menu_items table, error if empty
 *   - "static"    — always use bundled menuConfig.json
 *   - "fallback"  — try local database first, fall back to static if empty/error
 */
@Injectable()
export class MenuAssemblyService {
  private readonly logger = new Logger(MenuAssemblyService.name);
  private readonly menuSource: 'database' | 'static' | 'fallback';
  private readonly cacheTtlMs: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly templateService: HandlebarsTemplateService,
  ) {
    this.menuSource = this.configService.get<string>(
      'MENU_SOURCE',
      'fallback',
    ) as 'database' | 'static' | 'fallback';
    this.cacheTtlMs = this.configService.get<number>(
      'MENU_CACHE_TTL_MS',
      5 * 60 * 1000, // 5 minutes
    );
  }

  /**
   * Assemble the navigation menu for a user within an organization.
   * @param userId - User short hash ID (e.g. U-81F3)
   * @param orgId  - Organization short hash ID (e.g. O-92AF)
   * @param authToken - JWT bearer token (reserved for future privilege filtering)
   * @returns Assembled menu with source metadata
   */
  async assembleMenu(
    userId: string,
    orgId: string,
    authToken: string,
  ): Promise<AssembledMenu> {
    // Check cache first
    const cacheKey = `${userId}:${orgId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache hit for menu ${cacheKey}`);
      return cached.menu;
    }

    const templateContext = { org_id: orgId, user_id: userId };
    let menu: AssembledMenu;

    switch (this.menuSource) {
      case 'static':
        menu = this.assembleFromStatic(templateContext);
        break;

      case 'database':
        menu = await this.assembleFromDatabase(orgId, templateContext);
        break;

      case 'fallback':
      default:
        try {
          menu = await this.assembleFromDatabase(orgId, templateContext);
        } catch (error) {
          this.logger.warn(
            `Database menu assembly failed for org ${orgId}, falling back to static`,
            error instanceof Error ? error.message : error,
          );
          menu = this.assembleFromStatic(templateContext);
        }
        break;
    }

    // Cache the result
    this.cache.set(cacheKey, {
      menu,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return menu;
  }

  /**
   * Invalidate cached menus. Called when authorization events indicate
   * privilege changes that may affect navigation.
   * @param userId - Optional: invalidate only for a specific user. If omitted, clears all.
   * @param orgId  - Optional: invalidate only for a specific org (requires userId).
   */
  invalidateCache(userId?: string, orgId?: string): void {
    if (userId && orgId) {
      const key = `${userId}:${orgId}`;
      this.cache.delete(key);
      this.logger.debug(`Invalidated menu cache for ${key}`);
    } else {
      this.cache.clear();
      this.logger.debug('Invalidated all menu caches');
    }
  }

  /**
   * Assemble menu from the navigation service's own menu_items table.
   * Reads all active menu items for the org, groups by section, sorts by seq.
   * No privilege filtering yet — all active items are returned.
   */
  private async assembleFromDatabase(
    orgId: string,
    templateContext: Record<string, string>,
  ): Promise<AssembledMenu> {
    const allItems = await this.menuItemRepository.find({
      where: { organizationHashId: orgId, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    if (!allItems || allItems.length === 0) {
      throw new Error(`No menu items found in database for org ${orgId}`);
    }

    // Separate sections (parentId = null with children) from leaf items
    // Sections are top-level items that have children or a section field matching their own label
    const topLevel = allItems.filter((item) => item.parentId === null);
    const children = allItems.filter((item) => item.parentId !== null);

    // Build a map of parent UUID -> children
    const childMap = new Map<string, MenuItem[]>();
    for (const child of children) {
      const list = childMap.get(child.parentId!) || [];
      list.push(child);
      childMap.set(child.parentId!, list);
    }

    const sections: AssembledSection[] = topLevel
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => {
        const sectionChildren = childMap.get(section.id) || [];
        return {
          id: section.hashId,
          code: section.section || section.hashId,
          label: section.label,
          icon: section.icon || 'folder',
          seq: section.sortOrder,
          items: sectionChildren
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => {
              const { route, apiRoute } = this.templateService.renderRoutes(
                item.route || '',
                '', // apiRoute stored separately if needed
                templateContext,
              );
              return {
                id: item.hashId,
                code: item.privilegeCode || item.hashId,
                label: item.label,
                icon: item.icon || 'circle',
                route,
                apiRoute,
                seq: item.sortOrder,
              };
            }),
        };
      })
      .filter((section) => section.items.length > 0);

    return {
      sections,
      source: 'database',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Assemble menu from the static menuConfig.json bundled with the service.
   */
  private assembleFromStatic(
    templateContext: Record<string, string>,
  ): AssembledMenu {
    const config = staticMenuConfig as {
      sections: Array<{
        id: string;
        code: string;
        label: string;
        icon: string;
        seq: number;
        items: Array<{
          id: string;
          code: string;
          label: string;
          icon: string;
          fe_route_config: string;
          be_route_config: string;
          seq: number;
          visible_in_menu: boolean;
        }>;
      }>;
    };

    const sections: AssembledSection[] = config.sections
      .sort((a, b) => a.seq - b.seq)
      .map((section) => ({
        id: section.id,
        code: section.code,
        label: section.label,
        icon: section.icon,
        seq: section.seq,
        items: section.items
          .filter((item) => item.visible_in_menu)
          .sort((a, b) => a.seq - b.seq)
          .map((item) => {
            const { route, apiRoute } = this.templateService.renderRoutes(
              item.fe_route_config,
              item.be_route_config,
              templateContext,
            );
            return {
              id: item.id,
              code: item.code,
              label: item.label,
              icon: item.icon,
              route,
              apiRoute,
              seq: item.seq,
            };
          }),
      }));

    return {
      sections,
      source: 'static',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Seed the menu_items table from the static menuConfig.json.
   * This is idempotent — it skips items that already exist (by hashId).
   * @returns Count of items created.
   */
  async seedFromStatic(orgId: string): Promise<{ created: number; skipped: number }> {
    const config = staticMenuConfig as {
      sections: Array<{
        id: string;
        code: string;
        label: string;
        icon: string;
        seq: number;
        items: Array<{
          id: string;
          code: string;
          label: string;
          icon: string;
          fe_route_config: string;
          be_route_config: string;
          seq: number;
          visible_in_menu: boolean;
        }>;
      }>;
    };

    let created = 0;
    let skipped = 0;

    for (const section of config.sections) {
      // Check if section already exists
      const existingSection = await this.menuItemRepository.findOne({
        where: { hashId: section.id, organizationHashId: orgId },
      });

      let sectionEntity: MenuItem;
      if (existingSection) {
        sectionEntity = existingSection;
        skipped++;
      } else {
        sectionEntity = this.menuItemRepository.create({
          hashId: section.id,
          label: section.label,
          icon: section.icon,
          route: null,
          parentId: null,
          privilegeCode: null,
          sortOrder: section.seq,
          section: section.code,
          organizationHashId: orgId,
          isActive: true,
        });
        await this.menuItemRepository.save(sectionEntity);
        created++;
      }

      // Create child items
      for (const item of section.items) {
        const existingItem = await this.menuItemRepository.findOne({
          where: { hashId: item.id, organizationHashId: orgId },
        });

        if (existingItem) {
          skipped++;
          continue;
        }

        const childEntity = this.menuItemRepository.create({
          hashId: item.id,
          label: item.label,
          icon: item.icon,
          route: item.fe_route_config,
          parentId: sectionEntity.id,
          privilegeCode: item.code,
          sortOrder: item.seq,
          section: section.code,
          organizationHashId: orgId,
          isActive: item.visible_in_menu,
        });
        await this.menuItemRepository.save(childEntity);
        created++;
      }
    }

    // Invalidate cache after seeding
    this.cache.clear();

    this.logger.log(`Seeded menu items for org ${orgId}: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  }
}
