import { Test, TestingModule } from '@nestjs/testing';
import { HandlebarsTemplateService } from '../src/services/handlebars-template.service';

describe('HandlebarsTemplateService', () => {
  let service: HandlebarsTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HandlebarsTemplateService],
    }).compile();

    service = module.get<HandlebarsTemplateService>(HandlebarsTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should replace org_id placeholder', () => {
      const result = service.render('/org/{{org_id}}/dashboard', {
        org_id: 'O-92AF',
      });
      expect(result).toBe('/org/O-92AF/dashboard');
    });

    it('should replace user_id placeholder', () => {
      const result = service.render('/user/{{user_id}}/profile', {
        user_id: 'U-81F3',
      });
      expect(result).toBe('/user/U-81F3/profile');
    });

    it('should replace multiple placeholders', () => {
      const result = service.render(
        '/org/{{org_id}}/products/{{user_id}}/dashboard',
        { org_id: 'O-92AF', user_id: 'U-81F3' },
      );
      expect(result).toBe('/org/O-92AF/products/U-81F3/dashboard');
    });

    it('should handle templates with no placeholders', () => {
      const result = service.render('/static/route', { org_id: 'O-92AF' });
      expect(result).toBe('/static/route');
    });

    it('should return empty string for empty input', () => {
      const result = service.render('', { org_id: 'O-92AF' });
      expect(result).toBe('');
    });

    it('should return null/undefined input unchanged', () => {
      const result = service.render(null as unknown as string, {});
      expect(result).toBeNull();
    });

    it('should handle extra context keys gracefully', () => {
      const result = service.render('/org/{{org_id}}/test', {
        org_id: 'O-92AF',
        user_id: 'U-81F3',
        extra: 'value',
      });
      expect(result).toBe('/org/O-92AF/test');
    });

    it('should not HTML-escape values (noEscape mode)', () => {
      const result = service.render('/path/{{value}}', {
        value: 'a&b<c>d',
      });
      expect(result).toBe('/path/a&b<c>d');
    });
  });

  describe('renderRoutes', () => {
    it('should render both fe and be route configs', () => {
      const result = service.renderRoutes(
        '/org/{{org_id}}/products',
        '/api/v1/O/{{org_id}}/products',
        { org_id: 'O-92AF', user_id: 'U-81F3' },
      );
      expect(result.route).toBe('/org/O-92AF/products');
      expect(result.apiRoute).toBe('/api/v1/O/O-92AF/products');
    });

    it('should handle null fe_route_config', () => {
      const result = service.renderRoutes(null, '/api/v1/O/{{org_id}}/test', {
        org_id: 'O-92AF',
      });
      expect(result.route).toBeNull();
      expect(result.apiRoute).toBe('/api/v1/O/O-92AF/test');
    });

    it('should handle null be_route_config', () => {
      const result = service.renderRoutes('/org/{{org_id}}/test', null, {
        org_id: 'O-92AF',
      });
      expect(result.route).toBe('/org/O-92AF/test');
      expect(result.apiRoute).toBeNull();
    });

    it('should handle both null', () => {
      const result = service.renderRoutes(null, null, { org_id: 'O-92AF' });
      expect(result.route).toBeNull();
      expect(result.apiRoute).toBeNull();
    });
  });
});
