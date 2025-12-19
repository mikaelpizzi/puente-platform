# Análisis Profundo: Por qué tu Despliegue en Render Falla

## 🏗️ Arquitectura de la Plataforma Puente

```mermaid
graph TD
    subgraph "Frontend (Vercel)"
        PWA[PWA - React App]
    end

    subgraph "Render - Plan Free"
        GW[API Gateway :3000]
        AUTH[Auth Service :3001]
        PROD[Products Service :3002]
        FIN[Finance Service :3003]
        LOG[Logistics Service :3004]
        NOTIF[Notifications :3005]
    end

    subgraph "Bases de Datos Externas"
        SUPABASE[(Supabase - PostgreSQL)]
        MONGO[(MongoDB Atlas)]
        REDIS[(Redis)]
    end

    PWA -->|HTTPS| GW
    GW -->|Proxy + Headers| AUTH
    GW -->|Proxy + Headers| PROD
    GW -->|Proxy + Headers| FIN
    GW -->|Proxy + Headers| LOG

    AUTH -->|Prisma| SUPABASE
    FIN -->|Prisma| SUPABASE
    PROD -->|Mongoose| MONGO
    LOG -->|ioredis| REDIS
    NOTIF -->|ioredis| REDIS
```

---

## 🔄 Flujo Completo de una Request (Ej: María crea un producto)

### Paso 1: Frontend → API Gateway

```
POST https://puente-gateway.onrender.com/products
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body:
  { "name": "Producto", "price": 100, ... }
```

### Paso 2: Gateway - AuthMiddleware

El Gateway intercepta la request y ejecuta `AuthMiddleware`:

```typescript
// apps/backend/api-gateway/src/middleware/auth.middleware.ts
const secret = this.configService.get<string>('AUTH_JWT_ACCESS_SECRET');
const decoded = jwt.verify(token, secret!);
req.user = decoded; // { sub: "user-id", role: "SELLER", ... }
```

**⚠️ Punto de falla #1:**

- Si `AUTH_JWT_ACCESS_SECRET` en el Gateway ≠ `JWT_SECRET` usado por Auth Service para firmar
- Resultado: `401 Unauthorized - Invalid token`

### Paso 3: Gateway - Proxy Middleware

```typescript
// apps/backend/api-gateway/src/middleware/proxy.middleware.ts
proxyReq.setHeader('X-Gateway-Secret', sharedSecret);
proxyReq.setHeader('X-User-Id', req.user.sub);
proxyReq.setHeader('X-User-Role', req.user.role);

// Reenvía a: https://puente-products.onrender.com/products
```

**⚠️ Punto de falla #2:**

- Si `PRODUCTS_SERVICE_URL` está mal configurado
- Resultado: `503 Service Unavailable`

### Paso 4: Products Service - ServiceAuthGuard

```typescript
// apps/backend/products-service/src/common/guards/service-auth.guard.ts
const secretHeader = request.headers['x-gateway-secret'];
const expectedSecret = this.configService.get<string>('GATEWAY_SHARED_SECRET');

if (!expectedSecret) {
  return false; // ← DENIEGA TODO si no está configurado
}

if (secretHeader !== expectedSecret) {
  throw new UnauthorizedException('Service-to-Service authentication failed');
}
```

**⚠️ Punto de falla #3:**

- Si `GATEWAY_SHARED_SECRET` no está en Products Service → rechaza todo
- Si el secreto no coincide con el del Gateway → rechaza todo
- Resultado: `401 Unauthorized` o `403 Forbidden`

### Paso 5: Products Service - RolesGuard

```typescript
// apps/backend/products-service/src/common/guards/roles.guard.ts
const userRole = request.headers['x-user-role']; // "SELLER"
return requiredRoles.some((role) => role === userRole);
```

**⚠️ Punto de falla #4:**

- Si el rol no coincide (mayúsculas vs minúsculas)
- Si el header no llegó
- Resultado: `403 Forbidden`

### Paso 6: Products Service - MongoDB

```typescript
// apps/backend/products-service/src/app.module.ts
uri:
  configService.get<string>('PRODUCTS_MONGO_URI') ||
  configService.get<string>('MONGO_URI') ||
  'mongodb://localhost:27017/products',
```

**⚠️ Punto de falla #5:**

- Si `MONGO_URI` no está configurado, intenta conectar a `localhost:27017` (no existe en Render)
- Si MongoDB Atlas no tiene tu IP permitida
- Si las credenciales son incorrectas
- Resultado: Timeout → `503 Service Unavailable`

---

## 📋 Variables de Entorno CRÍTICAS por Servicio

### API Gateway (`puente-gateway`)

| Variable                 | Propósito                     | Debe coincidir con                 |
| ------------------------ | ----------------------------- | ---------------------------------- |
| `AUTH_JWT_ACCESS_SECRET` | Verificar tokens JWT          | `JWT_SECRET` en auth-service       |
| `AUTH_SERVICE_URL`       | URL del auth service          | URL real de Render                 |
| `PRODUCTS_SERVICE_URL`   | URL del products service      | URL real de Render                 |
| `FINANCE_SERVICE_URL`    | URL del finance service       | URL real de Render                 |
| `LOGISTICS_SERVICE_URL`  | URL del logistics service     | URL real de Render                 |
| `GATEWAY_SHARED_SECRET`  | Secreto para comunicación S2S | Mismo valor en TODOS los servicios |

### Auth Service (`puente-auth`)

| Variable            | Propósito                      | Debe coincidir con                  |
| ------------------- | ------------------------------ | ----------------------------------- |
| `JWT_SECRET`        | Firmar tokens JWT              | `AUTH_JWT_ACCESS_SECRET` en gateway |
| `AUTH_DATABASE_URL` | Conexión a PostgreSQL/Supabase | -                                   |

### Products Service (`puente-products`)

| Variable                | Propósito                    | Debe coincidir con     |
| ----------------------- | ---------------------------- | ---------------------- |
| `MONGO_URI`             | Conexión a MongoDB           | -                      |
| `GATEWAY_SHARED_SECRET` | Validar requests del gateway | Mismo valor en gateway |

### Finance Service (`puente-finance`)

| Variable                | Propósito                      | Debe coincidir con     |
| ----------------------- | ------------------------------ | ---------------------- |
| `FINANCE_DATABASE_URL`  | Conexión a PostgreSQL/Supabase | -                      |
| `GATEWAY_SHARED_SECRET` | Validar requests del gateway   | Mismo valor en gateway |

### Logistics Service (`puente-logistics`)

| Variable                | Propósito                    | Notas                                  |
| ----------------------- | ---------------------------- | -------------------------------------- |
| `REDIS_HOST`            | Host de Redis                | ⚠️ Código usa REDIS_HOST, no REDIS_URL |
| `REDIS_PORT`            | Puerto de Redis              | Default: 6379                          |
| `GATEWAY_SHARED_SECRET` | Validar requests del gateway | Mismo valor en gateway                 |

---

## 🔴 Problema con Render Free Tier: Variables NO se Aplican Automáticamente

Cuando cambias variables de entorno en Render dashboard:

1. **Las variables se guardan** ✅
2. **El servicio NO se reinicia automáticamente** ❌
3. **Necesitas hacer un "Manual Deploy" o "Restart"**

```
Render Dashboard → Tu Servicio → Settings →
  → "Manual Deploy" (consume cuota)
  → O "Restart Service" (no consume cuota si ya está desplegado)
```

### El problema de "sin cuota"

El plan Free de Render tiene límites:

- ~750 horas de build time al mes
- Si se acaba, no puedes redesplegar
- Pero **SÍ puedes reiniciar** servicios existentes sin consumir build time

---

## 🔧 Solución Inmediata (Sin Redesplegar)

1. Ve a cada servicio en Render Dashboard
2. Haz clic en "Manual Restart" (no "Manual Deploy")
3. Esto reinicia con las nuevas variables sin consumir cuota de build

---

## 📊 Tu render.yaml Actual vs Lo Necesario

### Faltan estas variables en render.yaml:

```yaml
# Para TODOS los servicios backend (products, finance, logistics, auth):
- key: GATEWAY_SHARED_SECRET
  sync: false

# Para API Gateway:
- key: API_GATEWAY_PORT
  value: '3000'

# Para Products Service (PORT incorrecto en main.ts):
# El código busca: process.env.PORT || process.env.PRODUCTS_SERVICE_PORT
# render.yaml tiene PORT, está bien

# Para Logistics Service (problema de Redis):
- key: REDIS_HOST
  sync: false
- key: REDIS_PORT
  value: '6379'
# ⚠️ Tu código NO usa REDIS_URL, usa REDIS_HOST + REDIS_PORT
```

---

## ✅ Checklist de Verificación

- [ ] `AUTH_JWT_ACCESS_SECRET` (gateway) = `JWT_SECRET` (auth) = **mismo valor**
- [ ] `GATEWAY_SHARED_SECRET` configurado en **todos** los servicios con el **mismo valor**
- [ ] `AUTH_SERVICE_URL` = `https://puente-auth.onrender.com`
- [ ] `PRODUCTS_SERVICE_URL` = `https://puente-products.onrender.com`
- [ ] `FINANCE_SERVICE_URL` = `https://puente-finance.onrender.com`
- [ ] `LOGISTICS_SERVICE_URL` = `https://puente-logistics.onrender.com`
- [ ] `MONGO_URI` en products-service apunta a MongoDB Atlas con IP permitida
- [ ] `AUTH_DATABASE_URL` en auth-service apunta a Supabase
- [ ] `FINANCE_DATABASE_URL` en finance-service apunta a Supabase
- [ ] **Servicios reiniciados** después de cambiar variables

---

## 🧪 Cómo Diagnosticar Sin Render

Puedes probar localmente simulando el entorno de Render:

```bash
# Terminal 1: Auth Service
cd apps/backend/auth-service
JWT_SECRET=mi-secreto-compartido npm run start:dev

# Terminal 2: Products Service
cd apps/backend/products-service
GATEWAY_SHARED_SECRET=otro-secreto MONGO_URI=tu-mongo-uri npm run start:dev

# Terminal 3: Gateway
cd apps/backend/api-gateway
AUTH_JWT_ACCESS_SECRET=mi-secreto-compartido \
GATEWAY_SHARED_SECRET=otro-secreto \
AUTH_SERVICE_URL=http://localhost:3001 \
PRODUCTS_SERVICE_URL=http://localhost:3002 \
npm run start:dev
```

Luego prueba con curl:

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@test.com","password":"password123"}'

# Usar el token para products
curl http://localhost:3000/products \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```
