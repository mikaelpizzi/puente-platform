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

## 🔭 Observability & Structured Logs

Each NestJS backend still imports `apps/backend/<service>/src/instrumentation.ts` **before** Nest starts, so the OpenTelemetry Node SDK boots with HTTP + Prisma/Mongoose/Redis auto-instrumentations. We also keep [`nestjs-pino`](https://github.com/iamolegga/nestjs-pino) as the global logger so every log carries the active `traceId`. The instrumentation now reads the exact environment variables Grafana Cloud recommends (service namespace, deployment environment, OTLP endpoint and Basic token header), and it gracefully steps aside if you prefer to run the official `NODE_OPTIONS=--require @opentelemetry/auto-instrumentations-node/register` flow.

### Grafana Cloud quickstart (local PNPM loop)

1. Copy `.env.example` and fill the new observability block:
   ```bash
   OTEL_TRACES_EXPORTER=otlp
   OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-east-2.grafana.net/otlp"
   OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <grafana-basic-token>"
   OTEL_SERVICE_NAMESPACE=my-application-group
   OTEL_DEPLOYMENT_ENVIRONMENT=development
   OTEL_NODE_RESOURCE_DETECTORS=env,host,os
   ```
   > 💡 Place your **actual Grafana token** inside `OTEL_EXPORTER_OTLP_HEADERS`. For safety keep it only in `.env` locally (ignored by git) or in `fly secrets`/Render env vars in prod.
2. (Optional) If you want to follow Grafana's "Direct on Linux" snippet verbatim, run any service with:
   ```bash
   OTEL_TRACES_EXPORTER="otlp" \
   OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-east-2.grafana.net/otlp" \
   OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <grafana-basic-token>" \
   OTEL_RESOURCE_ATTRIBUTES="service.name=puente-platform,service.namespace=my-application-group,deployment.environment=production" \
   OTEL_NODE_RESOURCE_DETECTORS="env,host,os" \
   NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register" \
   pnpm --filter @puente/api-gateway start:dev
   ```
   Our bootstrap files detect that `NODE_OPTIONS` already required the auto-register module and avoid double-starting the SDK.
3. Start the stack (`pnpm dev:backend`) and open Grafana Tempo → `Explore` to inspect spans grouped per service (e.g. `puente-api-gateway`, `puente-finance-service`).

### Docker / Compose

`docker-compose.yml` exposes a reusable `*otel-env` block with the same Grafana variables. Apply it to any container (`environment: *otel-env`) so the OTLP endpoint + headers travel with your services if/when you reintroduce them into Compose.

### Fly.io / production

Every `fly.toml` now carries the namespace/environment defaults plus the Grafana endpoint. Store the actual Basic token via secrets—never commit the real string:

```bash
fly secrets set \
  OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <grafana-basic-token>" \
  --app puente-auth-service
```

Repeat for the remaining services (or script it via `fly secrets import`). Structured logs and traces share the same IDs, so you can jump from a 500 in `puente-api-gateway` to the downstream Prisma query directly inside Grafana.

## 👥 User Roles & Current Capabilities

These are the three actors already wired across Auth, Products, Finance, Logistics and the PWA. Seed accounts are created automatically by `pnpm provision:data` (also listed in `docs/backend/postman-guide.md`).

| Role               | Demo Account                                 | What you can do today                                                                                                                                                                                                                | How to test it                                                                                                                                                                                                                                                                      |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Seller (Maria)** | `maria_vendedora@puente.com` / `password123` | Inventory dashboard (create/update products with optimistic UI), bulk stock adjustments, checkout to generate payment links/QRs, finance dashboard for orders, create deliveries and assign couriers, access logistics map/tracking. | 1) PWA: log in and navigate the Seller menu (`/inventory`, `/checkout`, `/finance`, `/logistics`). 2) Postman: follow sections 4.3–4.5 of `docs/backend/postman-guide.md` using the seller token to call `POST /products`, `POST /finance/orders`, `POST /deliveries`, etc.         |
| **Courier (Luis)** | `luis_repartidor@puente.com` / `password123` | Real-time delivery queue, accept/decline assignments, share live location (REST/WebSocket), update proof-of-progress states, consume logistic notifications.                                                                         | 1) PWA mobile layout: log in and open the Courier tabs to receive assignments. 2) Postman: section 4.6 sends `POST /logistics/location` with the courier token to publish telemetry (includes throttling expectations) and `GET /deliveries/:id/tracking` to verify status updates. |
| **Buyer (Carlos)** | `carlos_cliente@puente.com` / `password123`  | Marketplace browsing/cart, checkout as a consumer, receive payment links, view public tracking links for deliveries.                                                                                                                 | 1) PWA: log in as buyer to explore `/marketplace` and create orders. 2) Postman: section 4.4 explains how to create finance orders referencing `buyerId`; section 4.5 shows how buyers retrieve `/deliveries/:id/tracking` with their token.                                        |

> Need deeper API-by-API steps? Head to `docs/backend/postman-guide.md` for the full happy-path workflow (health checks, auth, finance, logistics, courier telemetry, metrics scraping) plus ready-to-paste JSON payloads.

## 📱 PWA Features Implemented

### 🗺️ Navigation by Role

| Role        | Tabs Available                         | Key Features                                  |
| ----------- | -------------------------------------- | --------------------------------------------- |
| **SELLER**  | Inicio, Inventario, Mis Ventas, Cobrar | Dispatch orders to couriers, manage inventory |
| **BUYER**   | Inicio, Comprar, Mis Compras           | Real-time tracking, post-delivery reviews     |
| **COURIER** | Envíos                                 | Accept jobs, complete delivery with POD       |

### 📦 Complete Order Flow

```
SELLER creates order → dispatches → COURIER accepts job
    → COURIER navigates (Google Maps) → completes delivery (photo/signature)
    → BUYER receives → leaves review ⭐
```

### ✅ Integrated Components

| Component          | Location          | Status                                        |
| ------------------ | ----------------- | --------------------------------------------- |
| `NotificationBell` | MainLayout header | ✅ Dropdown with NotificationCenter           |
| `ConflictResolver` | MainLayout        | ✅ Side-by-side diff for 409 conflicts        |
| `ReviewForm`       | OrderDetailsPage  | ✅ Star rating + comment for delivered orders |
| `ReviewsList`      | ProductDetailPage | ✅ Seller reviews with rating distribution    |
| `PODModal`         | LogisticsPage     | ✅ Camera, signature canvas, notes            |
| `DeliveryMap`      | OrderDetailsPage  | ✅ Real-time courier tracking (WebSocket)     |

### 🔄 Courier Workflow (LogisticsPage)

1. **Trabajos Disponibles** - Orders awaiting courier (`GET /orders/available-jobs`)
2. **Aceptar Trabajo** - Self-assign via `PATCH /orders/:id/assign-courier`
3. **Mis Entregas Activas** - Assigned orders (`GET /orders/courier`)
4. **Navegación** - Open address in Google Maps
5. **Completar Entrega** - POD modal with `POST /orders/:id/complete-delivery`

### ⭐ Post-Delivery Reviews

- BUYER can leave review after order status = `delivered`
- Star rating (1-5) with optional comment
- Persisted via `POST /products/reviews`
- Backend validates: only buyer, only delivered orders, one review per order

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
