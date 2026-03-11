import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from '../src/services/menu.service';
import { MenuItem } from '../src/models/entities/menu-item.entity';
import { HashIdService } from '../src/services/hash-id.service';
import { EventPublisherService } from '../src/events/event-publisher.service';

describe('MenuService', () => {
  let service: MenuService;
  let menuItemRepository: jest.Mocked<Repository<MenuItem>>;
  let hashIdService: jest.Mocked<HashIdService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  const mockMenuItem: Partial<MenuItem> = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    hashId: 'NAV-81F3',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    parentId: null,
    privilegeCode: null,
    sortOrder: 0,
    section: 'main',
    organizationHashId: 'O-92AF',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    children: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(MenuItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: HashIdService,
          useValue: { generate: jest.fn() },
        },
        {
          provide: EventPublisherService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    menuItemRepository = module.get(getRepositoryToken(MenuItem)) as jest.Mocked<Repository<MenuItem>>;
    hashIdService = module.get(HashIdService) as jest.Mocked<HashIdService>;
    eventPublisher = module.get(EventPublisherService) as jest.Mocked<EventPublisherService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByOrganization', () => {
    it('should return top-level menu items for an organization', async () => {
      menuItemRepository.find.mockResolvedValue([mockMenuItem as MenuItem]);

      const result = await service.findAllByOrganization('O-92AF');

      expect(menuItemRepository.find).toHaveBeenCalledWith({
        where: { organizationHashId: 'O-92AF', parentId: IsNull() },
        relations: ['children'],
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].hashId).toBe('NAV-81F3');
    });
  });

  describe('findOne', () => {
    it('should return a menu item by hashId and org', async () => {
      menuItemRepository.findOne.mockResolvedValue(mockMenuItem as MenuItem);

      const result = await service.findOne('O-92AF', 'NAV-81F3');

      expect(result.hashId).toBe('NAV-81F3');
      expect(result.label).toBe('Dashboard');
    });

    it('should throw NotFoundException if menu item not found', async () => {
      menuItemRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('O-92AF', 'NAV-0000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a menu item and publish event', async () => {
      hashIdService.generate.mockReturnValue('NAV-NEW1');
      menuItemRepository.create.mockReturnValue({
        ...mockMenuItem,
        hashId: 'NAV-NEW1',
      } as MenuItem);
      menuItemRepository.save.mockResolvedValue({
        ...mockMenuItem,
        hashId: 'NAV-NEW1',
      } as MenuItem);
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.create('O-92AF', {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        section: 'main',
      });

      expect(hashIdService.generate).toHaveBeenCalledWith('NAV');
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'navigation.menu.updated',
        'O',
        'O-92AF',
        expect.objectContaining({ menuItemHashId: 'NAV-NEW1', action: 'created' }),
      );
      expect(result.hashId).toBe('NAV-NEW1');
    });

    it('should resolve parent by hashId when parentHashId is provided', async () => {
      const parentItem = { ...mockMenuItem, id: 'parent-uuid', hashId: 'NAV-PRNT' } as MenuItem;
      hashIdService.generate.mockReturnValue('NAV-CHLD');
      menuItemRepository.findOne.mockResolvedValue(parentItem);
      menuItemRepository.create.mockReturnValue({
        ...mockMenuItem,
        hashId: 'NAV-CHLD',
        parentId: 'parent-uuid',
      } as MenuItem);
      menuItemRepository.save.mockResolvedValue({
        ...mockMenuItem,
        hashId: 'NAV-CHLD',
        parentId: 'parent-uuid',
      } as MenuItem);
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.create('O-92AF', {
        label: 'Child Item',
        parentHashId: 'NAV-PRNT',
      });

      expect(result.parentId).toBe('parent-uuid');
    });

    it('should throw NotFoundException if parent not found', async () => {
      hashIdService.generate.mockReturnValue('NAV-NEW1');
      menuItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('O-92AF', {
          label: 'Child Item',
          parentHashId: 'NAV-MISSING',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove menu item and publish event', async () => {
      menuItemRepository.findOne.mockResolvedValue(mockMenuItem as MenuItem);
      menuItemRepository.remove.mockResolvedValue(mockMenuItem as MenuItem);
      eventPublisher.publish.mockResolvedValue(undefined);

      await service.remove('O-92AF', 'NAV-81F3');

      expect(menuItemRepository.remove).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'navigation.menu.updated',
        'O',
        'O-92AF',
        { menuItemHashId: 'NAV-81F3', action: 'deleted' },
      );
    });

    it('should throw NotFoundException if menu item not in org', async () => {
      menuItemRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('O-92AF', 'NAV-0000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveMenuTree', () => {
    it('should filter menu items by privilege codes', async () => {
      const items: Partial<MenuItem>[] = [
        {
          id: '1',
          hashId: 'NAV-0001',
          label: 'Public',
          privilegeCode: null,
          parentId: null,
          isActive: true,
          sortOrder: 0,
          organizationHashId: 'O-92AF',
        },
        {
          id: '2',
          hashId: 'NAV-0002',
          label: 'Admin',
          privilegeCode: 'admin.access',
          parentId: null,
          isActive: true,
          sortOrder: 1,
          organizationHashId: 'O-92AF',
        },
        {
          id: '3',
          hashId: 'NAV-0003',
          label: 'Reports',
          privilegeCode: 'reports.view',
          parentId: null,
          isActive: true,
          sortOrder: 2,
          organizationHashId: 'O-92AF',
        },
      ];

      menuItemRepository.find.mockResolvedValue(items as MenuItem[]);

      const result = await service.resolveMenuTree('O-92AF', ['admin.access']);

      // Should include: Public (no privilege required) + Admin (privilege matched)
      // Should exclude: Reports (privilege not in allowed set)
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.label)).toEqual(['Public', 'Admin']);
    });

    it('should build nested tree structure', async () => {
      const items: Partial<MenuItem>[] = [
        {
          id: 'parent-1',
          hashId: 'NAV-P001',
          label: 'Settings',
          privilegeCode: null,
          parentId: null,
          isActive: true,
          sortOrder: 0,
          organizationHashId: 'O-92AF',
        },
        {
          id: 'child-1',
          hashId: 'NAV-C001',
          label: 'Profile',
          privilegeCode: null,
          parentId: 'parent-1',
          isActive: true,
          sortOrder: 0,
          organizationHashId: 'O-92AF',
        },
      ];

      menuItemRepository.find.mockResolvedValue(items as MenuItem[]);

      const result = await service.resolveMenuTree('O-92AF', []);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Settings');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].label).toBe('Profile');
    });
  });
});
