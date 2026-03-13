import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { MenuAssemblyService } from '../src/services/menu-assembly.service';
import { HandlebarsTemplateService } from '../src/services/handlebars-template.service';

describe('MenuAssemblyService', () => {
  let service: MenuAssemblyService;
  let httpService: jest.Mocked<HttpService>;

  const mockPrivilegesResponse = {
    privileges: [
      {
        id: 'PRV-DA01',
        privilegeCode: 'dashboard.view',
        privilegeLabel: 'View Dashboard',
        sectionId: 'SEC-DA01',
        sectionCode: 'dashboard',
        sectionLabel: 'Dashboard',
        sectionIcon: 'dashboard',
        sectionSeqNumber: 1,
        feRouteConfig: '/org/{{org_id}}/dashboard',
        beRouteConfig: '/api/v1/O/{{org_id}}/dashboard',
        icon: 'visibility',
        visibleInMenu: true,
        seqNumber: 1,
      },
      {
        id: 'PRV-DA02',
        privilegeCode: 'dashboard.designer',
        privilegeLabel: 'Dashboard Designer',
        sectionId: 'SEC-DA01',
        sectionCode: 'dashboard',
        sectionLabel: 'Dashboard',
        sectionIcon: 'dashboard',
        sectionSeqNumber: 1,
        feRouteConfig: '/org/{{org_id}}/dashboard/designer',
        beRouteConfig: '/api/v1/O/{{org_id}}/dashboard/designer',
        icon: 'design_services',
        visibleInMenu: true,
        seqNumber: 2,
      },
      {
        id: 'PRV-ID01',
        privilegeCode: 'identity.users.read',
        privilegeLabel: 'Users',
        sectionId: 'SEC-ID01',
        sectionCode: 'identity',
        sectionLabel: 'Identity',
        sectionIcon: 'person',
        sectionSeqNumber: 2,
        feRouteConfig: '/org/{{org_id}}/users',
        beRouteConfig: '/api/v1/O/{{org_id}}/users',
        icon: 'people',
        visibleInMenu: true,
        seqNumber: 1,
      },
      {
        id: 'PRV-HID01',
        privilegeCode: 'internal.system.check',
        privilegeLabel: 'System Check',
        sectionId: 'SEC-SYS01',
        sectionCode: 'system',
        sectionLabel: 'System',
        sectionIcon: 'settings',
        sectionSeqNumber: 99,
        feRouteConfig: null,
        beRouteConfig: '/api/v1/G/system/check',
        icon: 'check',
        visibleInMenu: false,
        seqNumber: 1,
      },
    ],
  };

  function createConfigService(overrides: Record<string, string | number> = {}) {
    const defaults: Record<string, string | number> = {
      AUTHORIZATION_SERVICE_URL: 'http://localhost:3002',
      MENU_SOURCE: 'fallback',
      MENU_CACHE_TTL_MS: 300000,
    };
    const merged = { ...defaults, ...overrides };
    return {
      get: jest.fn((key: string, defaultValue?: string | number) => {
        return merged[key] !== undefined ? merged[key] : defaultValue;
      }),
    };
  }

  function buildAxiosResponse<T>(data: T): AxiosResponse<T> {
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
  }

  async function createTestModule(
    configOverrides: Record<string, string | number> = {},
  ) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuAssemblyService,
        HandlebarsTemplateService,
        {
          provide: ConfigService,
          useValue: createConfigService(configOverrides),
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    return {
      service: module.get<MenuAssemblyService>(MenuAssemblyService),
      httpService: module.get(HttpService) as jest.Mocked<HttpService>,
    };
  }

  beforeEach(async () => {
    const result = await createTestModule();
    service = result.service;
    httpService = result.httpService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assembleMenu — database mode', () => {
    it('should assemble menu from authorization service privileges', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      const menu = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      expect(menu.source).toBe('database');
      expect(menu.generatedAt).toBeDefined();
      expect(menu.sections).toHaveLength(2); // dashboard + identity (system hidden)

      // Dashboard section
      const dashboard = menu.sections[0];
      expect(dashboard.code).toBe('dashboard');
      expect(dashboard.label).toBe('Dashboard');
      expect(dashboard.seq).toBe(1);
      expect(dashboard.items).toHaveLength(2);

      // First item: templated routes
      const viewDashboard = dashboard.items[0];
      expect(viewDashboard.code).toBe('dashboard.view');
      expect(viewDashboard.route).toBe('/org/O-92AF/dashboard');
      expect(viewDashboard.apiRoute).toBe('/api/v1/O/O-92AF/dashboard');

      // Identity section
      const identity = menu.sections[1];
      expect(identity.code).toBe('identity');
      expect(identity.seq).toBe(2);
      expect(identity.items).toHaveLength(1);
    });

    it('should forward JWT token to authorization service', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      await service.assembleMenu('U-81F3', 'O-92AF', 'my-jwt-token');

      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/O/O-92AF/users/U-81F3/privileges',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        }),
      );
    });

    it('should exclude privileges with visibleInMenu=false', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      const menu = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      // The "system" section should not appear because its only privilege has visibleInMenu=false
      const systemSection = menu.sections.find((s) => s.code === 'system');
      expect(systemSection).toBeUndefined();
    });

    it('should sort sections by seq_number', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      const menu = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      expect(menu.sections[0].seq).toBe(1);
      expect(menu.sections[1].seq).toBe(2);
    });

    it('should sort items within sections by seqNumber', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      const menu = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      const dashboard = menu.sections[0];
      expect(dashboard.items[0].seq).toBe(1);
      expect(dashboard.items[1].seq).toBe(2);
    });
  });

  describe('assembleMenu — static mode', () => {
    it('should return static menu when MENU_SOURCE=static', async () => {
      const result = await createTestModule({ MENU_SOURCE: 'static' });

      const menu = await result.service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      expect(menu.source).toBe('static');
      expect(menu.sections.length).toBeGreaterThanOrEqual(10);
      expect(result.httpService.get).not.toHaveBeenCalled();

      // Verify handlebars templating was applied to static config
      const dashboardSection = menu.sections.find((s) => s.code === 'dashboard');
      expect(dashboardSection).toBeDefined();
      expect(dashboardSection!.items[0].route).toBe('/org/O-92AF/dashboard');
    });
  });

  describe('assembleMenu — fallback mode', () => {
    it('should fall back to static when authorization service fails', async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      const menu = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      expect(menu.source).toBe('static');
      expect(menu.sections.length).toBeGreaterThanOrEqual(10);
    });

    it('should fall back to static when authorization returns empty privileges', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse({ privileges: [] })),
      );

      const menu = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      expect(menu.source).toBe('static');
    });
  });

  describe('caching', () => {
    it('should cache and return cached menu on second call', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      const menu1 = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');
      const menu2 = await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      // HTTP should only be called once
      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(menu1.generatedAt).toBe(menu2.generatedAt);
    });

    it('should use separate cache entries for different user/org combos', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');
      await service.assembleMenu('U-81F3', 'O-BBBB', 'test-token');

      expect(httpService.get).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache for specific user+org', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');
      service.invalidateCache('U-81F3', 'O-92AF');
      await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');

      expect(httpService.get).toHaveBeenCalledTimes(2);
    });

    it('should invalidate all caches', async () => {
      httpService.get.mockReturnValue(
        of(buildAxiosResponse(mockPrivilegesResponse)),
      );

      await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');
      await service.assembleMenu('U-AAAA', 'O-BBBB', 'test-token');
      service.invalidateCache();
      await service.assembleMenu('U-81F3', 'O-92AF', 'test-token');
      await service.assembleMenu('U-AAAA', 'O-BBBB', 'test-token');

      expect(httpService.get).toHaveBeenCalledTimes(4);
    });
  });
});
