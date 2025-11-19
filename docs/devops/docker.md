# Docker Images Playbook

Task 20 asked for production-ready Dockerfiles for every backend microservice and the React PWA. Each service now lives in its own multi-stage build located next to the code under `apps/**/Dockerfile`.

## Build strategy

- **Builder stage (Node 20 Alpine + pnpm):** Installs dependencies with `pnpm install --filter <package>...`, compiles TypeScript (`pnpm --filter <package>... build`) and uses `pnpm deploy --prod` to capture only the runtime files.
- **Runtime stage:** Copies the prepared artifact into a minimal Node 20 Alpine image (for NestJS apps) or `nginx:1.27-alpine` (for the PWA). Default `PORT` matches the values defined in `.env.example`.
- **Caching:** The root `.dockerignore` excludes `node_modules`, build artifacts and git metadata so Docker only sends the files that matter.

## Build commands

Run the following from the repository root (GitHub Flow expects `docker build` logs attached to the PR):

```powershell
# API Gateway
docker build -f apps/backend/api-gateway/Dockerfile -t puente/api-gateway:local .

# Auth Service
docker build -f apps/backend/auth-service/Dockerfile -t puente/auth-service:local .

# Products Service
docker build -f apps/backend/products-service/Dockerfile -t puente/products-service:local .

# Finance Service
docker build -f apps/backend/finance-service/Dockerfile -t puente/finance-service:local .

# Logistics Service
docker build -f apps/backend/logistics-service/Dockerfile -t puente/logistics-service:local .

# Frontend PWA (served by nginx on port 4173)
docker build -f apps/frontend/pwa/Dockerfile -t puente/pwa:local .
```

## Runtime notes

- Set the relevant `*_DATABASE_URL`, `PRODUCTS_MONGO_URI`, or `LOGISTICS_VALKEY_URL` variables at `docker run` time. The containers intentionally fail fast if the variables are missing.
- The NestJS images expose ports `3000-3004` respectively; the PWA image exposes `4173` via nginx with SPA routing fallback.
- The `pnpm deploy` step strips devDependencies, so the final images only contain production code plus the compiled `dist/` directory.
