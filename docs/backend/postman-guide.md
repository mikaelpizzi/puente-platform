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

> **Seeded demo users:** running `pnpm provision:data` creates three actors. Use them unless you want to register fresh accounts.
> | Role | Email | Password |
> | --- | --- | --- |
> | Seller | `maria_vendedora@puente.com` | `password123` |
> | Courier | `luis_repartidor@puente.com` | `password123` |
> | Buyer | `carlos_cliente@puente.com` | `password123` |

Follow the steps below in order. Each block includes the exact method, URL, headers, and JSON payload you can paste into Postman.

### 4.1 Register or login

- **Endpoint:** `POST {{auth_service_url}}/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "maria_vendedora@puente.com",
    "password": "password123"
  }
  ```
- **Expected:** `200 OK` with `{ "accessToken", "refreshToken", "user" }`. Add a test script: `pm.environment.set('bearer_token', pm.response.json().accessToken); pm.environment.set('refresh_token', pm.response.json().refreshToken); pm.environment.set('seller_id', pm.response.json().user.id);`

> Repeat the same request with the courier and buyer emails so you have `courier_token`, `buyer_token`, etc. (use `pm.environment.set('courier_token', ...)`).

### 4.2 Gateway sanity check

- **Endpoint:** `GET {{api_gateway_url}}/health`
- **Headers:** none
- **Expected:** `200` with `{"status":"ok"}` confirming the gateway is reachable.

To verify a proxied health route:

- **Endpoint:** `GET {{api_gateway_url}}/products/health`
- **Headers:** `Authorization: Bearer {{bearer_token}}`
- **Expected:** `200` with the products service health payload.

### 4.3 Products workflow (seller token)

1. **Create product**
   - **Endpoint:** `POST {{api_gateway_url}}/products`
   - **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{bearer_token}}`
   - **Body:**
     ```json
     {
       "name": "Mochila Artesanal",
       "description": "Hecha a mano con cuero local",
       "price": 45,
       "sku": "MOCH-001",
       "vertical": "fashion",
       "stock": 10,
       "attributes": {
         "color": "marron",
         "material": "cuero"
       }
     }
     ```
   - **Expected:** `201` with the stored product (capture `productId` → `pm.environment.set('product_id', pm.response.json().id)`).

2. **List products**
   - **Endpoint:** `GET {{api_gateway_url}}/products`
   - **Headers:** `Authorization: Bearer {{bearer_token}}`
   - **Expected:** Array containing the product created above.

### 4.4 Finance workflow (seller + buyer IDs)

1. **Create order**
   - **Endpoint:** `POST {{api_gateway_url}}/finance/orders`
   - **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{bearer_token}}`
   - **Body:**
     ```json
     {
       "sellerId": "{{seller_id}}",
       "buyerId": "{{buyer_id}}",
       "items": [
         {
           "productId": "{{product_id}}",
           "quantity": 1,
           "price": 45
         }
       ]
     }
     ```
   - **Expected:** `201` with `{ "id", "status": "PENDING" }`. Store `order_id` via Postman script.

2. **Generate payment link**
   - **Endpoint:** `POST {{api_gateway_url}}/finance/orders/{{order_id}}/payment`
   - **Headers:** `Authorization: Bearer {{bearer_token}}`
   - **Expected:** `201` with mocked Mercado Pago payload (contains `paymentUrl`).

3. **Trigger compensation test (optional)**
   - **Endpoint:** `POST {{api_gateway_url}}/finance/orders/{{order_id}}/compensate`
   - **Headers:** `Authorization: Bearer {{bearer_token}}`
   - **Expected:** `200` with `{ "status": "ROLLED_BACK" }` to validate Saga rollback.

### 4.5 Logistics delivery workflow (seller token)

1. **Create delivery**
   - **Endpoint:** `POST {{api_gateway_url}}/deliveries`
   - **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{bearer_token}}`
   - **Body:**
     ```json
     {
       "orderId": "{{order_id}}",
       "pickupLocation": { "lat": -12.0464, "lng": -77.0428 },
       "dropoffLocation": { "lat": -12.078, "lng": -77.05 }
     }
     ```
   - **Expected:** `201` with `{ "id": "{{delivery_id}}", "status": "PENDING" }`.

2. **Assign courier**
   - **Endpoint:** `PATCH {{api_gateway_url}}/deliveries/{{delivery_id}}/assign`
   - **Headers:** `Authorization: Bearer {{bearer_token}}`
   - **Body:** `{ "driverId": "{{courier_id}}" }`
   - **Expected:** `200` with status `ASSIGNED` and `driverId` persisted.

3. **Update status**
   - **Endpoint:** `PATCH {{api_gateway_url}}/deliveries/{{delivery_id}}/status`
   - **Headers:** `Authorization: Bearer {{bearer_token}}`
   - **Body:** `{ "status": "PICKED_UP" }`
   - **Expected:** `200` with updated status (later set to `DELIVERED`).

4. **Get tracking link**
   - **Endpoint:** `GET {{api_gateway_url}}/deliveries/{{delivery_id}}/tracking`
   - **Headers:** `Authorization: Bearer {{buyer_token}}` (buyers fetch their tracking link)
   - **Expected:** `200` with `{ "url": "https://puente.app/track/{{delivery_id}}?..." }`.

### 4.6 Courier telemetry + throttling (courier token)

- **Endpoint:** `POST {{api_gateway_url}}/logistics/location`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{courier_token}}`
- **Body:**
  ```json
  {
    "driverId": "{{courier_id}}",
    "lat": -12.05,
    "lng": -77.04
  }
  ```
- **Expected:** `200` `{ "success": true }`. Send ~5 distinct requests quickly (within 3 seconds) and a sixth one should respond `429 Too Many Requests` indicating the throttling window is active. The metrics endpoint (next section) will increment `logistics_telemetry_throttled_total`.

### 4.7 Prometheus metrics snapshot

- **Endpoint:** `GET {{logistics_service_url}}/metrics`
- **Headers:** none (local service access only)
- **Expected:** plaintext exposition format. Search for:
  - `logistics_telemetry_ingest_total{source="rest"}` → increments per successful REST update.
  - `logistics_telemetry_throttled_total{source="rest"}` → increments when you hit 429s.

### 4.8 Refresh token flow

- **Endpoint:** `POST {{auth_service_url}}/auth/refresh`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{refresh_token}}` (place the refresh token in the body if your implementation requires it)
- **Body:**
  ```json
  {
    "refreshToken": "{{refresh_token}}"
  }
  ```
- **Expected:** `200` with a brand-new `accessToken` and `refreshToken`. Update the environment variables so the frontend/mobile apps can continue without re-login.

## 5. Edge-case drills (recommended Postman tests)

Run these after the happy-path sequence to ensure the backend enforces validation, authorization, and compensating logic. Document failures in your PRs.

| Area                      | Scenario                                                                                  | Expected response                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Auth                      | `POST /auth/register` with duplicate email                                                | `409` Conflict, message about email already in use.                               |
| Auth                      | `POST /auth/login` with wrong password                                                    | `401` with `Invalid credentials`.                                                 |
| Auth                      | `POST /auth/refresh` using revoked/unknown refresh token                                  | `401` and the body explains the token is invalid or expired.                      |
| API Gateway               | Call `GET /products` without `Authorization` header                                       | `401` from `JwtAuthGuard`.                                                        |
| API Gateway               | Call `GET /products` with forged JWT (tampered signature)                                 | `401`, confirm the guard rejects the token.                                       |
| Products                  | `POST /products` missing mandatory fields                                                 | `400` validation error listing the offending fields.                              |
| Finance                   | `POST /finance/orders` with empty `items` array                                           | `400`, Prisma validation fails before touching DB.                                |
| Finance                   | `POST /finance/orders/:id/payment` twice                                                  | Second call returns `409` or a domain-specific error that payment already exists. |
| Finance                   | `POST /finance/orders/:id/compensate` before payment                                      | `409`/`400` indicating invalid Saga transition.                                   |
| Logistics                 | `POST /deliveries` with malformed coordinates                                             | `400` from validation pipes.                                                      |
| Logistics                 | `PATCH /deliveries/:id/status` skipping states (e.g., jump from `PENDING` to `DELIVERED`) | `409` due to state machine guard.                                                 |
| Gateway resiliency        | Stop one downstream service (e.g., products) and hit `/products` via the gateway          | `502`/`504`, verify gateway logs show proxy failure.                              |
| Logistics telemetry limit | Burst-hit `POST /logistics/location` with the same courier token 6 times in <3s           | First five succeed, sixth returns `429 Too Many Requests`.                        |

## 6. Troubleshooting quick wins

| Symptom                                             | Fix                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` from Postman                         | Ensure `pnpm dev:backend` is still running and `docker compose ps` shows postgres/mongo/redis healthy.                            |
| Prisma complains about missing `.env` vars          | Re-copy `.env.example` and confirm `AUTH_DATABASE_URL` / `FINANCE_DATABASE_URL` point to localhost.                               |
| Port already in use when running `pnpm dev:backend` | Kill stray Node processes: `Get-NetTCPConnection -LocalPort <port> \| ForEach-Object { Stop-Process -Id $PSItem.OwningProcess }`. |
| JWT failures via API Gateway                        | Confirm `AUTH_JWT_ACCESS_SECRET` in `.env` matches the one Postman uses (same file used by auth-service and gateway).             |

Once this flow works locally, you can export the Postman collection/environment and share it with teammates so everyone hits the exact same endpoints.
