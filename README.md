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

### Start the Environment

You can start the entire platform with a single command using `pnpm` (recommended) or the provided PowerShell script.

Cross-platform (recommended):

```bash
pnpm docker:up
```

PowerShell (Windows):

```powershell
./scripts/up.ps1
```

What these do:

1. Build all microservices.
2. Start Postgres, MongoDB and Redis.
3. Start all backend services and the frontend.

Access the application at [http://localhost:8080](http://localhost:8080).

### Stop the Environment

Using `pnpm`:

```bash
pnpm docker:down
```

PowerShell:

```powershell
./scripts/down.ps1
```

### Useful docker helpers

```bash
pnpm docker:logs   # follow logs for all services
pnpm docker:ps     # list running service containers
```

## 🛠 Manual Setup (Development)

If you prefer to run services individually for development:

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Start Infrastructure Only**
   You can use `docker-compose` to start only the databases:

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
