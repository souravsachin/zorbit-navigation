# zorbit-navigation

Dynamic navigation menu management service for the Zorbit platform.

Handles menu CRUD, route registration, and per-user menu resolution based on privileges.

See [CLAUDE.md](./CLAUDE.md) for full service documentation.

## Quick Start

```bash
npm install
cp .env.example .env
docker-compose up -d
npm run migration:run
npm run start:dev
```

The service runs on port 3003 by default.
