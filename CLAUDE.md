# Zorbit Service: zorbit-navigation

## Purpose

This repository implements the navigation service for the Zorbit platform.

Zorbit is a MACH-compliant shared platform infrastructure used to build enterprise applications.

The navigation service provides dynamic navigation menu management, route registration, and per-user menu generation based on roles and privileges.

## Responsibilities

- Dynamic menu management (CRUD for menu items)
- Route registration and management
- Menu tree resolution per user based on privileges
- Privilege-filtered navigation generation
- Hierarchical menu structure (parent/child items, sections)
- Event-driven sync with authorization changes

## Architecture Context

This service follows Zorbit platform architecture.

Key rules:

- REST API grammar: /api/v1/{namespace}/{namespace_id}/resource
- namespace-based multi-tenancy (G, O, D, U)
- short hash identifiers (PREFIX-HASH, e.g. NAV-81F3, RTE-92AF)
- event-driven integration (domain.entity.action)
- service isolation

## Dependencies

Allowed dependencies:

- zorbit-identity (JWT validation)
- zorbit-authorization (privilege resolution)
- zorbit-messaging (Kafka)

Forbidden dependencies:

- direct database access to other services
- cross-service code imports

## Platform Dependencies

Upstream services:
- zorbit-identity (JWT authentication)
- zorbit-authorization (privilege resolution)
- zorbit-messaging (Kafka)

Downstream consumers:
- All frontend applications (resolved menus)

## Repository Structure

- /src/api — route definitions
- /src/controllers — request handlers
- /src/services — business logic
- /src/models — database entities and DTOs
- /src/events — event publishers and consumers
- /src/middleware — JWT, namespace, logging middleware
- /src/config — configuration module
- /tests — unit and integration tests

## Running Locally

```bash
npm install
cp .env.example .env
docker-compose up -d  # PostgreSQL + Kafka
npm run migration:run
npm run start:dev
```

Service runs on port 3003 (default). Production/server: port 3103.

## Events Published

- navigation.menu.updated
- navigation.route.registered
- navigation.route.removed

## Events Consumed

- authorization.role.created
- authorization.role.updated
- authorization.privilege.assigned

## API Endpoints

- GET /api/v1/O/:orgId/navigation/menus
- POST /api/v1/O/:orgId/navigation/menus
- GET /api/v1/O/:orgId/navigation/menus/:menuId
- PUT /api/v1/O/:orgId/navigation/menus/:menuId
- DELETE /api/v1/O/:orgId/navigation/menus/:menuId
- POST /api/v1/O/:orgId/navigation/routes
- GET /api/v1/U/:userId/navigation/resolved

## Development Guidelines

Follow Zorbit architecture rules.
