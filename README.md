# Puente Platform

> **Venture-Ready Microservices Architecture** for scalable e-commerce and logistics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-development-orange.svg)

## 🏗 Architecture

The platform is built as a monorepo using **PNPM Workspaces** and **NestJS** microservices, orchestrated via an API Gateway.

| Service               | Tech Stack         | Port   | Description                                            |
| --------------------- | ------------------ | ------ | ------------------------------------------------------ |
| **API Gateway**       | NestJS             | `3000` | Unified entry point, routing, and rate limiting.       |
| **Auth Service**      | NestJS + Postgres  | `3001` | Authentication, Authorization (RBAC), User Management. |
| **Products Service**  | NestJS + MongoDB   | `3002` | Product catalog, inventory, and search.                |
| **Finance Service**   | NestJS + Postgres  | `3003` | Payments, Ledger, P2P transactions.                    |
| **Logistics Service** | NestJS + Redis     | `3004` | Real-time tracking, courier assignment.                |
| **Frontend**          | React + Vite (PWA) | `8080` | Progressive Web App for users and couriers.            |

## 🚀 Quick Start

We provide utility scripts to spin up the entire ecosystem in Docker.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js v20+](https://nodejs.org/)
- [PNPM](https://pnpm.io/) (`npm install -g pnpm`)

## 🚀 Quick Start (developer loop in seconds)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (only infrastructure containers run inside Docker)
- [Node.js v20+](https://nodejs.org/)
- [PNPM](https://pnpm.io/) (`corepack enable pnpm` is recommended)

### 1. Copy the env template & install deps

```bash
cp .env.example .env   # Windows: copy .env.example .env
pnpm install
```

### 2. One command to start everything

```bash
pnpm dev:stack
```

or, on Windows, run the PowerShell helper (same steps under the hood):

```powershell
./scripts/up.ps1
```

This workflow performs four stages sequentially:

1. `docker compose up -d postgres mongo redis`
2. `pnpm provision:data` → verifies Postgres/Mongo/Redis connectivity and logs to `docs/data/tenants.md`
3. `pnpm dev:db` → applies Prisma schemas for **auth-service** and **finance-service**
4. `pnpm dev:backend` → starts API Gateway + all microservices with `nest start --watch`

### 3. Verify each service with HTTP

Every service now exposes a `/health` endpoint. You can validate them individually without going through the gateway:

```bash
# Auth (no headers required)


# Products (Mongo-backed)
2. **Start Infrastructure Only**

# Finance (needs the shared secret like the real Gateway would)
   You can use `docker-compose` to start only the databases:

# Logistics (Redis-backed)


# API Gateway
curl http://localhost:3000/health
```

### 4. Stopping the stack

```bash
pnpm dev:infra:down
```

or on Windows:

```powershell
./scripts/down.ps1
```

> ℹ️ The NestJS services run on your host machine. Stop them with `Ctrl+C` in the terminal that executed `pnpm dev:stack`/`scripts/up.ps1`.

### 5. Exercising the APIs with Postman

Once the stack is up, follow `docs/backend/postman-guide.md` for a step-by-step walkthrough that covers environment setup, auth token capture, and the happy-path requests for every microservice via the API Gateway.

### Docker helpers (infra only)

```bash
pnpm docker:logs   # follow container logs (databases only)
pnpm docker:ps     # list running infra containers
```

```bash
docker-compose up -d postgres mongo redis
```

3. **Run Migrations**

   ```bash
   # Auth Service
   pnpm --filter @puente/auth-service prisma migrate dev

   # Finance Service
   pnpm --filter @puente/finance-service prisma migrate dev
   ```

4. **Start Services**
   ```bash
   pnpm --filter @puente/api-gateway start:dev
   # ... repeat for other services
   ```

## 🧪 Testing

Run unit tests across the workspace:

```bash
pnpm test
```

Run e2e tests:

```bash
pnpm test:e2e
```

## 📦 Deployment

The project is configured for **Continuous Deployment** via GitHub Actions:

- **Backend Services**: Deployed to [Render](https://render.com) / [Fly.io](https://fly.io).
- **Frontend**: Deployed to Render Static Sites.
- **Databases**: Managed via Aiven / MongoDB Atlas.

See `.github/workflows` for pipeline details.

## 🤝 Contribution

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

Please ensure `pnpm lint` and `pnpm test` pass before submitting.
