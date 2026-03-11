import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MenuItem } from '../models/entities/menu-item.entity';
import { CreateMenuItemDto } from '../models/dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../models/dto/update-menu-item.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { NavigationEvents } from '../events/navigation.events';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * List all top-level menu items for an organization, with children loaded.
   */
  async findAllByOrganization(orgId: string): Promise<MenuItem[]> {
    return this.menuItemRepository.find({
      where: { organizationHashId: orgId, parentId: IsNull() },
      relations: ['children'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Find a single menu item by hashId, scoped to an organization.
   */
  async findOne(orgId: string, menuHashId: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { hashId: menuHashId, organizationHashId: orgId },
      relations: ['children'],
    });

    if (!item) {
      throw new NotFoundException(
        `Menu item ${menuHashId} not found in organization ${orgId}`,
      );
    }

    return item;
  }

  /**
   * Create a new menu item within an organization.
   */
  async create(orgId: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    const hashId = this.hashIdService.generate('NAV');

    let parentId: string | null = null;
    if (dto.parentHashId) {
      const parent = await this.menuItemRepository.findOne({
        where: { hashId: dto.parentHashId, organizationHashId: orgId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent menu item ${dto.parentHashId} not found in organization ${orgId}`,
        );
      }
      parentId = parent.id;
    }

    const item = this.menuItemRepository.create({
      hashId,
      label: dto.label,
      icon: dto.icon || null,
      route: dto.route || null,
      parentId,
      privilegeCode: dto.privilegeCode || null,
      sortOrder: dto.sortOrder ?? 0,
      section: dto.section || null,
      organizationHashId: orgId,
      isActive: dto.isActive ?? true,
    });

    await this.menuItemRepository.save(item);

    await this.eventPublisher.publish(
      NavigationEvents.MENU_UPDATED,
      'O',
      orgId,
      {
        menuItemHashId: item.hashId,
        action: 'created',
        label: item.label,
        organizationHashId: orgId,
      },
    );

    this.logger.log(`Created menu item ${item.hashId} in organization ${orgId}`);
    return item;
  }

  /**
   * Update an existing menu item within an organization.
   */
  async update(orgId: string, menuHashId: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { hashId: menuHashId, organizationHashId: orgId },
    });

    if (!item) {
      throw new NotFoundException(
        `Menu item ${menuHashId} not found in organization ${orgId}`,
      );
    }

    if (dto.label !== undefined) item.label = dto.label;
    if (dto.icon !== undefined) item.icon = dto.icon;
    if (dto.route !== undefined) item.route = dto.route;
    if (dto.privilegeCode !== undefined) item.privilegeCode = dto.privilegeCode;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.section !== undefined) item.section = dto.section;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    if (dto.parentHashId !== undefined) {
      if (dto.parentHashId === null) {
        item.parentId = null;
      } else {
        const parent = await this.menuItemRepository.findOne({
          where: { hashId: dto.parentHashId, organizationHashId: orgId },
        });
        if (!parent) {
          throw new NotFoundException(
            `Parent menu item ${dto.parentHashId} not found in organization ${orgId}`,
          );
        }
        item.parentId = parent.id;
      }
    }

    await this.menuItemRepository.save(item);

    await this.eventPublisher.publish(
      NavigationEvents.MENU_UPDATED,
      'O',
      orgId,
      {
        menuItemHashId: item.hashId,
        action: 'updated',
        updatedFields: Object.keys(dto),
      },
    );

    return item;
  }

  /**
   * Delete a menu item within an organization.
   */
  async remove(orgId: string, menuHashId: string): Promise<void> {
    const item = await this.menuItemRepository.findOne({
      where: { hashId: menuHashId, organizationHashId: orgId },
    });

    if (!item) {
      throw new NotFoundException(
        `Menu item ${menuHashId} not found in organization ${orgId}`,
      );
    }

    await this.menuItemRepository.remove(item);

    await this.eventPublisher.publish(
      NavigationEvents.MENU_UPDATED,
      'O',
      orgId,
      {
        menuItemHashId: menuHashId,
        action: 'deleted',
      },
    );

    this.logger.log(`Deleted menu item ${menuHashId} from organization ${orgId}`);
  }

  /**
   * Build a full menu tree for an organization, filtered by privilege codes.
   * Returns only active items whose privilegeCode is in the allowed set (or null = always visible).
   */
  async resolveMenuTree(orgId: string, privilegeCodes: string[]): Promise<MenuItem[]> {
    const allItems = await this.menuItemRepository.find({
      where: { organizationHashId: orgId, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    // Filter by privilege
    const allowed = allItems.filter(
      (item) => item.privilegeCode === null || privilegeCodes.includes(item.privilegeCode),
    );

    // Build tree from flat list
    const itemMap = new Map<string, MenuItem & { children: MenuItem[] }>();
    const roots: (MenuItem & { children: MenuItem[] })[] = [];

    for (const item of allowed) {
      itemMap.set(item.id, { ...item, children: [] });
    }

    for (const item of allowed) {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
