# Lightweight Docker Stack for Development

Task 20 was re-scoped to prioritise a **fast local feedback loop** instead of heavy production builds. Rather than launching seven containers every time, we now keep Docker responsible only for the stateful dependencies (Postgres, MongoDB, Redis) and run the NestJS services directly on the host with hot reload.

## What `docker-compose.yml` does now

- Spins up **Postgres 16**, **MongoDB 6** and **Redis 7** with sensible defaults declared in `.env` / `.env.example`.
- All databases share a single bridge network `puente-dev`, expose their default ports to `localhost`, and persist data via named volumes (`postgres_data`, `mongo_data`, `redis_data`).
- Postgres includes a health check so Prisma migrations wait until the server is ready.

```bash
# Start only the infra layer (used by pnpm dev:stack and scripts/up.ps1)
pnpm dev:infra

# Tear it down when finished
pnpm dev:infra:down
```

## Full workflow (one command)

```
pnpm dev:stack
```

Behind the scenes this executes:

1. `pnpm dev:infra` → `docker compose up -d postgres mongo redis`
2. `pnpm provision:data` → smoke-tests Postgres/Mongo/Redis connectivity and writes `docs/data/tenants.md`
3. `pnpm dev:db` → runs `prisma db push` for **auth-service** and **finance-service** so schemas are in sync
4. `pnpm dev:backend` → starts all NestJS microservices with `nest start --watch` in parallel (API Gateway, Auth, Products, Finance, Logistics)

From there you can hit the new `/health` endpoint exposed by every service:

```bash
curl http://localhost:3001/health
curl -H "x-gateway-secret: dev-gateway-secret" http://localhost:3003/health
```

## Why this matters

- **Start in seconds:** Databases warm up once and stay running; services restart instantly via hot reload.
- **Debuggable:** Because services run on the host, you can attach debuggers, use breakpoints, and inspect stack traces without rebuilding containers.
- **Production ready later:** The original multi-stage Dockerfiles still live next to each service for future deployment work, but they are no longer part of the inner dev loop.

For more context and troubleshooting steps, see `README.md` (Quick Start) and `scripts/up.ps1`, which now orchestrates the same workflow for Windows users.
