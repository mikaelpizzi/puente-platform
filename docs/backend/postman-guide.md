# Backend + Postman Bring-Up Guide

This checklist explains how to boot the entire backend locally (Docker infra + five NestJS services) and exercise the HTTP APIs from Postman. Follow the steps in order; each one unblocks the next.

## 1. One-time workstation prep

1. **Install Docker Desktop** and make sure it is running. Enable the WSL2 engine if you are on Windows.
2. **Install pnpm 9** (already declared via `packageManager` in `package.json`). From PowerShell run `corepack enable` so `pnpm` resolves automatically.
3. **Copy environment variables:** `Copy-Item .env.example .env -Force`. Edit `.env` if you need to override any port or credential.
4. **Prisma client generation:** `pnpm install` already generates Prisma clients, but if you ever bump the schema run `pnpm --filter @puente/auth-service exec prisma generate` and the finance equivalent.

## 2. Bring up infra + services (watch mode)

> The `pnpm dev:backend` script automates everything below. You only need to run manual commands if you want to debug a single step.

1. **Start infrastructure:** `pnpm dev:infra` (or `docker compose up -d postgres mongo redis`). Verify containers with `docker compose ps`.
2. **Seed the databases:** `pnpm provision:data` loads baseline users/products/orders.
3. **Apply Prisma schemas:** `pnpm dev:db` runs `prisma db push` for auth/finance so the tables match the models.
4. **Launch services:** `pnpm dev:backend` starts (in watch mode):
   - api-gateway on `http://localhost:3000`
   - auth-service on `http://localhost:3001`
   - products-service on `http://localhost:3002`
   - finance-service on `http://localhost:3003`
   - logistics-service on `http://localhost:3004`
5. **Health verification:** the script polls `GET /health` on each service and prints `[dev-backend] <service> healthy`. Wait for the "All services are healthy" banner before opening Postman.
6. **Shutdown:** Press `Ctrl+C` in the terminal when finished. Run `pnpm dev:infra:down` if you want to stop Docker as well.

## 3. Configure Postman once

1. Create a Postman **Environment** named `Puente Local` with these variables:
   - `api_gateway_url` = `http://localhost:3000`
   - `auth_service_url` = `http://localhost:3001`
   - `products_service_url` = `http://localhost:3002`
   - `finance_service_url` = `http://localhost:3003`
   - `logistics_service_url` = `http://localhost:3004`
   - `bearer_token` = _leave empty; the auth request will populate it._
2. (Optional) Create a **collection** and add the requests below so you can run them as a Postman Collection Runner later.

## 4. Happy-path request sequence

1. **Register or login:**
   - `POST {{auth_service_url}}/auth/register` (body: `email`, `password`, `role`).
   - `POST {{auth_service_url}}/auth/login` to receive `accessToken` and `refreshToken`.
   - Use a Postman test script to set `pm.environment.set('bearer_token', pm.response.json().accessToken)`.
2. **Gateway sanity check:**
   - `GET {{api_gateway_url}}/health` → expect `200` `{"status":"ok"...}`.
   - `GET {{api_gateway_url}}/products/health` (proxied) with `Authorization: Bearer {{bearer_token}}`.
3. **Products workflow:**
   - `POST {{api_gateway_url}}/products` with product payload `{ name, price, attributes }`.
   - `GET {{api_gateway_url}}/products` to confirm listing.
4. **Finance workflow:**
   - `POST {{api_gateway_url}}/finance/orders` with `{ sellerId, buyerId, items[] }`.
   - `POST {{api_gateway_url}}/finance/orders/{{id}}/payment` to simulate payment link creation.
   - `POST {{api_gateway_url}}/finance/orders/{{id}}/compensate` to test Saga rollback.
5. **Logistics workflow:**
   - `POST {{api_gateway_url}}/deliveries` with pickup/dropoff coordinates.
   - `PATCH {{api_gateway_url}}/deliveries/{{id}}/status` to mark progress; validate events in terminal logs.
6. **Refresh token flow (optional):**
   - `POST {{auth_service_url}}/auth/refresh` with the refresh token to obtain a new access token.

## 5. Edge-case drills (recommended Postman tests)

Run these after the happy-path sequence to ensure the backend enforces validation, authorization, and compensating logic. Document failures in your PRs.

| Area                       | Scenario                                                                                  | Expected response                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Auth                       | `POST /auth/register` with duplicate email                                                | `409` Conflict, message about email already in use.                               |
| Auth                       | `POST /auth/login` with wrong password                                                    | `401` with `Invalid credentials`.                                                 |
| Auth                       | `POST /auth/refresh` using revoked/unknown refresh token                                  | `401` and the body explains the token is invalid or expired.                      |
| API Gateway                | Call `GET /products` without `Authorization` header                                       | `401` from `JwtAuthGuard`.                                                        |
| API Gateway                | Call `GET /products` with forged JWT (tampered signature)                                 | `401`, confirm the guard rejects the token.                                       |
| Products                   | `POST /products` missing mandatory fields                                                 | `400` validation error listing the offending fields.                              |
| Finance                    | `POST /finance/orders` with empty `items` array                                           | `400`, Prisma validation fails before touching DB.                                |
| Finance                    | `POST /finance/orders/:id/payment` twice                                                  | Second call returns `409` or a domain-specific error that payment already exists. |
| Finance                    | `POST /finance/orders/:id/compensate` before payment                                      | `409`/`400` indicating invalid Saga transition.                                   |
| Logistics                  | `POST /deliveries` with malformed coordinates                                             | `400` from validation pipes.                                                      |
| Logistics                  | `PATCH /deliveries/:id/status` skipping states (e.g., jump from `PENDING` to `DELIVERED`) | `409` due to state machine guard.                                                 |
| Gateway resiliency         | Stop one downstream service (e.g., products) and hit `/products` via the gateway          | `502`/`504`, verify gateway logs show proxy failure.                              |
| Rate limiting (if enabled) | Burst-hit `POST /auth/login` with invalid creds 10x quickly                               | `429` once the limit is exceeded.                                                 |

## 6. Troubleshooting quick wins

| Symptom                                             | Fix                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` from Postman                         | Ensure `pnpm dev:backend` is still running and `docker compose ps` shows postgres/mongo/redis healthy.                            |
| Prisma complains about missing `.env` vars          | Re-copy `.env.example` and confirm `AUTH_DATABASE_URL` / `FINANCE_DATABASE_URL` point to localhost.                               |
| Port already in use when running `pnpm dev:backend` | Kill stray Node processes: `Get-NetTCPConnection -LocalPort <port> \| ForEach-Object { Stop-Process -Id $PSItem.OwningProcess }`. |
| JWT failures via API Gateway                        | Confirm `AUTH_JWT_ACCESS_SECRET` in `.env` matches the one Postman uses (same file used by auth-service and gateway).             |

Once this flow works locally, you can export the Postman collection/environment and share it with teammates so everyone hits the exact same endpoints.
