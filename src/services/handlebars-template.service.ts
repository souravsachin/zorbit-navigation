import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

/**
 * Utility service for applying handlebars templating to route configurations.
 *
 * Translates route templates like:
 *   "/org/{{org_id}}/products/{{user_id}}/dashboard"
 * into resolved paths like:
 *   "/org/O-92AF/products/U-81F3/dashboard"
 */
@Injectable()
export class HandlebarsTemplateService {
  /**
   * Compile and render a handlebars template string with the given context.
   * @param template - Handlebars template string (e.g. "/org/{{org_id}}/dashboard")
   * @param context  - Key-value pairs for replacement (e.g. { org_id: "O-92AF" })
   * @returns Resolved string with placeholders replaced
   */
  render(template: string, context: Record<string, string>): string {
    if (!template) {
      return template;
    }
    const compiled = Handlebars.compile(template, { noEscape: true });
    return compiled(context);
  }

  /**
   * Render both fe_route_config and be_route_config for a privilege item.
   * Returns an object with the resolved route and apiRoute.
   */
  renderRoutes(
    feRouteConfig: string | null,
    beRouteConfig: string | null,
    context: Record<string, string>,
  ): { route: string | null; apiRoute: string | null } {
    return {
      route: feRouteConfig ? this.render(feRouteConfig, context) : null,
      apiRoute: beRouteConfig ? this.render(beRouteConfig, context) : null,
    };
  }
}
