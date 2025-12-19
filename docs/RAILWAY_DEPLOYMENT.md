# Railway Deployment Guide - Puente Platform

This guide will help you deploy all Puente backend services to Railway.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- $5 free credits (available on new accounts)
- Git repository pushed to GitHub/GitLab

---

## Step 1: Create a New Project in Railway

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select `puente-platform-fintech`

---

## Step 2: Deploy Each Service

You need to create **6 separate services** in the same Railway project. For each service:

### 2.1 API Gateway

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repo again
3. Railway will auto-detect the Dockerfile. Click **Settings** tab:
   - **Root Directory**: `apps/backend/api-gateway`
   - Or set **Dockerfile Path**: `apps/backend/api-gateway/Dockerfile`
4. Go to **Variables** tab and add:

```env
PORT=3000
NODE_ENV=production
OTEL_SDK_DISABLED=true
AUTH_JWT_ACCESS_SECRET=your-super-secret-jwt-key-here
GATEWAY_SHARED_SECRET=your-gateway-secret-here
AUTH_SERVICE_URL=${{auth-service.RAILWAY_PUBLIC_DOMAIN}}
PRODUCTS_SERVICE_URL=${{products-service.RAILWAY_PUBLIC_DOMAIN}}
FINANCE_SERVICE_URL=${{finance-service.RAILWAY_PUBLIC_DOMAIN}}
LOGISTICS_SERVICE_URL=${{logistics-service.RAILWAY_PUBLIC_DOMAIN}}
```

> **Note**: The `${{service.VARIABLE}}` syntax references other services in Railway. You'll update these after creating all services.

5. Rename this service to `api-gateway` (click on service name)

---

### 2.2 Auth Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Settings:
   - **Root Directory**: `apps/backend/auth-service`
3. Variables:

```env
PORT=3001
NODE_ENV=production
OTEL_SDK_DISABLED=true
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
AUTH_DATABASE_URL=postgresql://user:password@host:5432/database
GATEWAY_SHARED_SECRET=your-gateway-secret-here
```

> **Critical**: `JWT_SECRET` must be the SAME value as `AUTH_JWT_ACCESS_SECRET` in api-gateway!

4. Rename to `auth-service`

---

### 2.3 Products Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Settings:
   - **Root Directory**: `apps/backend/products-service`
3. Variables:

```env
PORT=3002
NODE_ENV=production
OTEL_SDK_DISABLED=true
ENABLE_SEARCH=false
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/products
GATEWAY_SHARED_SECRET=your-gateway-secret-here
```

4. Rename to `products-service`

---

### 2.4 Finance Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Settings:
   - **Root Directory**: `apps/backend/finance-service`
3. Variables:

```env
PORT=3003
NODE_ENV=production
OTEL_SDK_DISABLED=true
FINANCE_DATABASE_URL=postgresql://user:password@host:5432/finance_db
GATEWAY_SHARED_SECRET=your-gateway-secret-here
```

4. Rename to `finance-service`

---

### 2.5 Logistics Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Settings:
   - **Root Directory**: `apps/backend/logistics-service`
3. Variables:

```env
PORT=3004
NODE_ENV=production
OTEL_SDK_DISABLED=true
ENABLE_OSRM=false
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
GATEWAY_SHARED_SECRET=your-gateway-secret-here
```

> **Important**: This service uses `REDIS_HOST` + `REDIS_PORT`, NOT `REDIS_URL`!

4. Rename to `logistics-service`

---

### 2.6 Notification Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Settings:
   - **Root Directory**: `apps/backend/notification-service`
3. Variables:

```env
PORT=3005
NODE_ENV=production
OTEL_SDK_DISABLED=true
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USER=resend
MAIL_PASSWORD=your-resend-api-key
MAIL_FROM=noreply@yourdomain.com
GATEWAY_SHARED_SECRET=your-gateway-secret-here
```

4. Rename to `notification-service`

---

## Step 3: Update Service URLs

After all services are deployed:

1. Go to each service → **Settings** → Copy the **Public URL** (e.g., `https://auth-service-production.up.railway.app`)
2. Go to **api-gateway** → **Variables** → Update:

```env
AUTH_SERVICE_URL=https://auth-service-production.up.railway.app
PRODUCTS_SERVICE_URL=https://products-service-production.up.railway.app
FINANCE_SERVICE_URL=https://finance-service-production.up.railway.app
LOGISTICS_SERVICE_URL=https://logistics-service-production.up.railway.app
```

---

## Step 4: Update Frontend Environment

In your Vercel dashboard (or wherever frontend is deployed):

```env
VITE_API_URL=https://api-gateway-production.up.railway.app
```

---

## Environment Variables Checklist

| Variable                 | Gateway | Auth | Products | Finance | Logistics | Notif |
| ------------------------ | ------- | ---- | -------- | ------- | --------- | ----- |
| `PORT`                   | 3000    | 3001 | 3002     | 3003    | 3004      | 3005  |
| `NODE_ENV`               | prod    | prod | prod     | prod    | prod      | prod  |
| `AUTH_JWT_ACCESS_SECRET` | ✅      | -    | -        | -       | -         | -     |
| `JWT_SECRET`             | -       | ✅   | -        | -       | -         | -     |
| `JWT_REFRESH_SECRET`     | -       | ✅   | -        | -       | -         | -     |
| `GATEWAY_SHARED_SECRET`  | ✅      | ✅   | ✅       | ✅      | ✅        | ✅    |
| `AUTH_DATABASE_URL`      | -       | ✅   | -        | -       | -         | -     |
| `FINANCE_DATABASE_URL`   | -       | -    | -        | ✅      | -         | -     |
| `MONGO_URI`              | -       | -    | ✅       | -       | -         | -     |
| `REDIS_HOST`             | -       | -    | -        | -       | ✅        | ✅    |
| `REDIS_PORT`             | -       | -    | -        | -       | ✅        | ✅    |
| `*_SERVICE_URL`          | ✅      | -    | -        | -       | -         | -     |

### Critical Alignment

These must have the **SAME VALUE**:

- `AUTH_JWT_ACCESS_SECRET` (gateway) = `JWT_SECRET` (auth)
- `GATEWAY_SHARED_SECRET` across ALL services

---

## Troubleshooting

### 503 Service Unavailable

- Check if all services are running (green status in Railway)
- Verify `*_SERVICE_URL` variables point to correct Railway URLs

### 401 Unauthorized

- Ensure `JWT_SECRET` = `AUTH_JWT_ACCESS_SECRET`
- Ensure `GATEWAY_SHARED_SECRET` is identical across all services

### Database Connection Errors

- Verify database URLs are correct
- Check if database allows connections from Railway IPs
- For MongoDB Atlas: Add `0.0.0.0/0` to IP whitelist (or specific Railway IPs)
- For Supabase: Should work automatically
