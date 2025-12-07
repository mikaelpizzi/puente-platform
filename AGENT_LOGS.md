# AGENT_LOGS

> Bitácora interna: no se comitea ni se empuja. Igual restricción aplica a `TASKS.md`, `TASKS_LOGS.md`, `FLOW.md` y `ARCHITECTURE.md`.

## 2025-11-17
- Reviewed `ARCHITECTURE.md` para comprender dominios (Auth, Products, Finance, Logistics, PWA) y capturar requisitos funcionales y no funcionales.
- Generé `TASKS.md` en la raíz con 34 tareas enumeradas y etiquetadas (FE/BE/DEVOPS/etc.) listas para tablero Kanban.
- Actualicé `TASKS.md` detallando el significado de cada acrónimo de tipo y agregando shirt tags `[S|M|L]` para estimar el esfuerzo de todas las tareas.
- Añadí la sección 4.5 en `ARCHITECTURE.md` especificando estándares en inglés para commits, pull requests y comentarios de código.
- Añadí la sección 4.6 en `ARCHITECTURE.md` enfatizando soluciones robustas, seguras y pruebas obligatorias por capa.
- Reescribí `TASKS.md` para que cada tarea incluya un criterio explícito de pruebas/evidencia (`Test`).
- Ejecuté la Tarea 3 creando el monorepo PNPM (package.json, pnpm-workspace, tsconfig base) y scaffold de `apps/backend/*` y `apps/frontend/pwa` con pruebas Vitest y `corepack pnpm lint/test` en verde.
- Añadí la sección 4.7 en `ARCHITECTURE.md` con lineamientos para sugerir ramas, mensajes de commit/PR y el uso obligatorio de `TASKS_LOGS.md`.
- Actualicé `.gitignore` para excluir `AGENT_LOGS.md`, `TASKS.md` y `TASKS_LOGS.md`, y cree `TASKS_LOGS.md` con el registro detallado de la Tarea 3.
- Amplié `TASKS_LOGS.md` para la Tarea 3 con misión, pasos de implementación y pruebas reproducibles paso a paso.
- Ejecuté la Tarea 4 creando `.env.example` con placeholders seguros para todos los microservicios y añadiendo `docs/security/secrets.md` con la política de manejo de secretos (principios, matriz de proveedores, checklist y plan de rotación).

## 2025-11-19
- Desarrollé la Tarea 20 añadiendo `.dockerignore`, Dockerfiles multi-stage (Node 20/Nginx) para los cinco microservicios NestJS y la PWA, y documentación en `docs/devops/docker.md` con comandos de build/verificación.
- Actualicé `auth-service` y `finance-service` para Prisma 7 (quitando `datasource.url` del schema, migrando `prisma.config.ts` a `defineConfig`, e inyectando las URLs desde `PrismaService`).
- Ejecución de pruebas (`pnpm --filter @puente/auth-service test` y `pnpm --filter @puente/finance-service test`) para asegurar que los refactors no rompieran la lógica existente; intenté `docker build` pero la máquina carece de Docker Desktop en ejecución, así que se documentó el bloqueo en `TASKS_LOGS.md`.

## 2025-11-30
- Ejecuté la Tarea 17 (telemetría + throttling) añadiendo a `logistics-service` un historial corto de ubicaciones en Redis, rate limiting configurable por `driverId` y publicación de eventos hacia WebSocket.
- Creé `src/metrics` (service/controller/module) con `prom-client` para exponer `/metrics` y contadores `logistics_telemetry_ingest_total`, `logistics_telemetry_throttled_total` y el histograma de latencia.
- Documenté los nuevos toggles en `.env.example`, actualicé `docs/backend/postman-guide.md` con flujos paso a paso (incluyendo JSON listo para Postman, headers y pruebas del 429), y registré la evidencia en `TASKS.md` + `TASKS_LOGS.md`.
- Actualicé pruebas (`logistics.service.spec.ts` + `test/delivery.spec.ts`) y corrí `pnpm --filter @puente/logistics-service test` para garantizar cobertura verde tras los cambios.

## 2025-12-05
- Arranqué la rama `feat/task-32-otel` siguiendo `FLOW.md` para aterrizar la Tarea 32 (observabilidad) y audité `apps/backend/*` para entender sus `main.ts`, `app.module.ts`, scripts y despliegues antes de tocar código.
- Añadí dependencias de telemetría y logging (`@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`, `nestjs-pino`, etc.) en cada microservicio, corrí `pnpm install` en la raíz y validé que `pnpm-lock.yaml` quedara actualizado.
- Creé `src/instrumentation.ts` por servicio para inicializar `NodeSDK` con metadata (`service.name`, version y envs) y exportar un `shutdown` hook; modifiqué `main.ts` para importar/arrancar la instrumentación antes de bootstrapping Nest.
- Registré `LoggerModule` (nestjs-pino) en todos los `app.module.ts` con un extractor de `traceId`/`spanId`, ajusté `main.ts` para usar `app.useLogger(app.get(Logger))` y habilité `bufferLogs` + `shutdownHooks`.
- Documenté nuevas variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_SERVICE_NAME`) en `.env.example`, `docker-compose.yml` (services + shared env) y cada `fly.toml`, además de añadir la sección de Observability en `README.md` y `ARCHITECTURE.md`.
- Ejecuté `pnpm --filter @puente/api-gateway test`, `@puente/auth-service test`, `@puente/products-service test` (arreglando mocks de `ConfigService` y header secreto), `@puente/finance-service test` y `@puente/logistics-service test` para comprobar que la instrumentación no rompió nada.

## 2025-12-04
- Cre� docs/backend/observability-guide.md como entregable extra de la Tarea 32: gu�a para leer trazas en Grafana Tempo, correlaci�n de logs con traceId, y configuraci�n de alertas b�sicas (error rate, latencia P99, servicio ca�do).
- Implement� SanityCheckMiddleware en los 4 microservicios internos (auth, products, finance, logistics) para la Tarea 36, rechazando GET/DELETE con body como defensa en profundidad.
- Registr� el middleware globalmente en cada pp.module.ts usando NestModule.configure() con orRoutes('*').
- Ejecut� todos los test suites (auth: 16, products: 15, finance: 14, logistics: 9) para verificar que no hubo regresiones.
- Cre� rama eat/task-36-sanity-middleware y commite� los cambios.

## 2025-12-04 (Late Night Session)
- Implement� la migraci�n de colores del frontend de indigo/purple a la paleta esmeralda  Financiera Fresca (#10B981 primario, #334155 secundario).
- Actualic� 	ailwind.config.js con sistema de colores brand.
- Migr� 11 componentes principales: MainLayout, LoginPage, RegisterPage, ProductCard, MarketplacePage, CheckoutPage, FinancePage, DashboardHome, InventoryDashboard, PosKeypad.
- El bot�n verde de Cobrar en PosKeypad ahora da la satisfacci�n de saldo positivo.
- Cre� rama eat/task-37-38-color-scheme desde main actualizado.

## 2025-12-06
- **Task 39, 40, 41 (Custom Tags & Multi-tag):**
  - Verified and finalized implementation of TagsModule (Backend) and TagManager (Frontend).
  - Verified Product schema updates for 	ags array.
  - Verified InventoryDashboard integration (multi-select, bulk actions).
  - Verified CheckoutPage filtering and ProductCard display.
  - Fixed 5 lint errors (TS6133) in frontend to ensure clean build.
  - Verified successful builds for both backend and frontend.
  - Updated 	ask.md marking tasks as DONE.
  - Created branch eat/custom-tags-management.

## Task 39, 40, 41 - Images, Orders, Search
- **Date:** 2025-12-06
- **Status:** DONE
- **Changes:**
  - **Task 39 (Images):** Added imageUrl to Product schema/interfaces. Implemented getUploadSignature (mocked). Added Image Upload UI to InventoryDashboard and display in ProductCard.
  - **Task 41 (Search):** Added search, minPrice, maxPrice, tags, vertical filters to ProductsService and ProductsController. Implemented Search Bar and Filters in MarketplacePage.
  - **Task 40 (Orders):** Created OrdersPage with mock data for Buyer/Seller views. Added /orders route and navigation link.
- **Notes:**
  - Backend for Task 40 is PENDING (using mock data).
  - Cloudinary credentials are mocked.

## 2025-12-06 (Advanced Inventory & UI Polish)
- **Task 42 (Advanced Inventory):**
  - **Schema:** Updated Product schema for 'inventoryStatus' ('ACTIVE'|'TRASH') and 'images' (array).
  - **Frontend:** Implemented MultiImageDropzone with DnD reordering (HTML5).
  - **Trash:** Added Soft Delete, Restore, and Permanent Delete (UI only for permanent).
  - **Dashboard:** Split view into 'Activos' vs 'Papelera'.
- **UI Refinements (Extras):**
  - **ProductCard:** Image Carousel with hover arrows. Trash button moved to footer.
  - **Modals:** Created Unified 'ConfirmationModal' for elegant alerts.
  - **Inputs:** Removed spinners from Price/Stock, fixed '0' clearing issue.
- **Outcome:** DONE. Verified build and extensive manual testing of image flows and inputs.
- **Artifacts:** check 'pr_draft.md' and 'walkthrough.md'.


## 2025-12-07: Task 40 - Orders Backend
- Cre� rama eat/task-40-orders-backend desde main
- Implement� m�dulo Orders en products-service:
  - Schema Order con Mongoose (status enum, items subdocument)
  - DTOs con class-validator (CreateOrderDto, UpdateOrderStatusDto)
  - OrdersService con CRUD + updateStatus + cancel
  - OrdersController con guards (ServiceAuthGuard, RolesGuard)
  - OrdersModule registrado en AppModule
- Escrib� tests con Vitest usando patr�n class-based MockOrderModel (tipado estricto, sin any)
- Cre� ordersApi.ts con RTK Query (6 endpoints)
- Actualic� OrdersPage.tsx para consumir API real en lugar de mock data
- Registr� ordersApi en Redux store
- Builds de backend y frontend exitosos
- 10 tests unitarios pasando

## 2025-12-07: Tasks 42-45 Backend Integrations

### Resumen de cambios
- **Task 42:** Creé módulo Messages en products-service para chat por orden
- **Task 43:** Reemplacé mock de P2P con adaptadores reales Binance/CoinGecko
- **Task 44:** Integré Nodemailer con Gmail para emails reales
- **Task 45:** Implementé OsrmService para rutas reales con Docker OSRM

### Archivos creados/modificados

**Task 42 (products-service):**
- src/messages/schemas/order-message.schema.ts
- src/messages/dto/create-message.dto.ts
- src/messages/messages.service.ts
- src/messages/messages.controller.ts
- src/messages/messages.module.ts
- src/app.module.ts (registré MessagesModule)

**Task 43 (finance-service):**
- src/p2p/adapters/binance.adapter.ts
- src/p2p/adapters/coingecko.adapter.ts
- src/p2p/rates-cache.service.ts
- src/p2p/p2p.module.ts (actualizado)
- src/p2p/p2p.service.ts (actualizado con fallback y cache)
- src/p2p/p2p.service.spec.ts (8 tests)

**Task 44 (auth-service):**
- src/email/email.service.ts
- src/email/email.module.ts
- src/auth/auth.module.ts (importé EmailModule)
- src/auth/auth.service.ts (integré EmailService)
- src/auth/auth.controller.ts (nuevo endpoint send-verification)

**Task 45 (logistics-service):**
- src/routing/osrm.service.ts
- src/routing/routing.module.ts
- src/routing/osrm.service.spec.ts (8 tests)
- src/app.module.ts (registré RoutingModule)
- docs/OSRM_SETUP.md (documentación)

### Ramas creadas
- feat/task-42-order-messages
- feat/task-43-real-p2p-rates
- feat/task-44-email-integration
- feat/task-45-osrm-routing

### Tests ejecutados
- finance-service: 8 tests (p2p) ✅
- logistics-service: 8 tests (routing) ✅
- Builds: Todos los servicios compilan sin errores ✅
