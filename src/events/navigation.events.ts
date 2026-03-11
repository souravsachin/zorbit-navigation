/**
 * Canonical event type constants for the navigation domain.
 * Naming convention: domain.entity.action
 */
export const NavigationEvents = {
  MENU_UPDATED: 'navigation.menu.updated',
  ROUTE_REGISTERED: 'navigation.route.registered',
  ROUTE_REMOVED: 'navigation.route.removed',
} as const;

export type NavigationEventType = (typeof NavigationEvents)[keyof typeof NavigationEvents];

/**
 * Events consumed from the authorization domain.
 */
export const AuthorizationEvents = {
  ROLE_CREATED: 'authorization.role.created',
  ROLE_UPDATED: 'authorization.role.updated',
  PRIVILEGE_ASSIGNED: 'authorization.privilege.assigned',
} as const;

export type AuthorizationEventType = (typeof AuthorizationEvents)[keyof typeof AuthorizationEvents];

/**
 * Canonical event envelope for all Zorbit platform events.
 */
export interface ZorbitEventEnvelope<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  namespace: string;
  namespaceId: string;
  payload: T;
  metadata?: Record<string, string>;
}
