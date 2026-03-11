import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NavigationResolverService } from '../src/services/navigation-resolver.service';
import { MenuService } from '../src/services/menu.service';
import { MenuItem } from '../src/models/entities/menu-item.entity';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NavigationResolverService', () => {
  let service: NavigationResolverService;
  let menuService: jest.Mocked<MenuService>;

  const mockMenuItems: Partial<MenuItem>[] = [
    {
      id: '1',
      hashId: 'NAV-0001',
      label: 'Dashboard',
      route: '/dashboard',
      privilegeCode: null,
      parentId: null,
      isActive: true,
      sortOrder: 0,
      organizationHashId: 'O-92AF',
      children: [],
    },
  ];

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavigationResolverService,
        {
          provide: MenuService,
          useValue: {
            resolveMenuTree: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              if (key === 'AUTHORIZATION_SERVICE_URL') return 'http://localhost:3002';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NavigationResolverService>(NavigationResolverService);
    menuService = module.get(MenuService) as jest.Mocked<MenuService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveForUser', () => {
    it('should fetch privileges and resolve menu tree', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ privilegeCodes: ['dashboard.view', 'reports.view'] }),
      });

      menuService.resolveMenuTree.mockResolvedValue(mockMenuItems as MenuItem[]);

      const result = await service.resolveForUser('U-81F3', 'O-92AF');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/O/O-92AF/users/U-81F3/privileges',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(menuService.resolveMenuTree).toHaveBeenCalledWith(
        'O-92AF',
        ['dashboard.view', 'reports.view'],
      );
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Dashboard');
    });

    it('should return unrestricted items when authorization service is unavailable', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      menuService.resolveMenuTree.mockResolvedValue(mockMenuItems as MenuItem[]);

      const result = await service.resolveForUser('U-81F3', 'O-92AF');

      // Should call resolveMenuTree with empty privileges
      expect(menuService.resolveMenuTree).toHaveBeenCalledWith('O-92AF', []);
      expect(result).toHaveLength(1);
    });

    it('should return empty privileges when authorization returns non-OK status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      menuService.resolveMenuTree.mockResolvedValue(mockMenuItems as MenuItem[]);

      await service.resolveForUser('U-81F3', 'O-92AF');

      expect(menuService.resolveMenuTree).toHaveBeenCalledWith('O-92AF', []);
    });
  });
});
