# TASKS

Basado íntegramente en `ARCHITECTURE.md`. Cada tarea está pensada para un sprint corto estilo Kanban y etiquetada por tipo: `[PM]` = planificación/gestión, `[BE]` = backend NestJS, `[FE]` = frontend React PWA, `[DEVOPS]` = plataforma/CI/CD, `[DATA]` = bases de datos/persistencia, `[QA]` = aseguramiento de calidad, `[DOC]` = documentación, `[SEC]` = seguridad/secrets y `[OBS]` = observabilidad. Cada ítem incluye un shirt tag `[S|M|L]` para estimar esfuerzo **y** un criterio **Test** que debe cumplirse al finalizar (pruebas automatizadas o evidencia verificable).

> Nota: `TASKS.md`, `TASKS_LOGS.md`, `FLOW.md`, `ARCHITECTURE.md` y `AGENT_LOGS.md` son bitácoras locales. Nunca deben incluirse en commits ni subirse al remoto.

1. [PM][S] Configurar un tablero Kanban (Trello) con columnas Backlog → Ready → In Progress → Review → Done y limite WIP=1. **Test:** Compartir enlace o captura del tablero mostrando columnas y WIP=1 configurado.
	- **Estado:** TODO
	- **Problema:** No existe un flujo visual que limite el WIP y ayude a priorizar tareas para un solo desarrollador.
	- **Solución:** Crear tablero con columnas estándar y activar límite WIP=1 en In Progress/Review para forzar enfoque.
	- **Entregables extra:** Checklist visible de políticas y compartir acceso con stakeholders.
2. [PM][S] Definir criterios de "Definition of Ready" y "Definition of Done" para microservicios NestJS y la PWA. **Test:** Añadir el documento a `docs/process/dor-dod.md` y enlazarlo en el README; PR debe mostrar aprobación propia.
	- **Estado:** TODO
	- **Problema:** Las tareas entran al flujo sin criterios claros, provocando retrabajo e interpretaciones distintas.
	- **Solución:** Documentar acuerdos específicos (requisitos previos, pruebas mínimas, evidencia) y socializarlos.
	- **Entregables extra:** Plantilla reutilizable para PRs/Issues basada en estos criterios.
3. [DEVOPS][L] Inicializar el monorepo (pnpm workspace + TypeScript base) creando `apps/backend/*` y `apps/frontend/pwa` con lint/test compartido. **Test:** Ejecutar `pnpm install && pnpm lint` en CI con salida verde y mostrar estructura generada.
	- **Estado:** DONE
	- **Problema:** No hay estructura única para manejar múltiples servicios ni herramientas compartidas.
	- **Solución:** Configurar pnpm workspace, tsconfig base y carpetas para backend/frontend con scripts comunes.
	- **Entregables extra:** README inicial describiendo cómo agregar nuevos paquetes o apps.
4. [SEC][M] Crear `/.env.example` y política de manejo de secretos para Fly.io, Render, Aiven, Mongo Atlas y proveedores de pagos. **Test:** Agregar `docs/security/secrets.md` y demostrar en PR que `git status` está limpio (sin secretos); incluir checklist firmada.
	- **Estado:** DONE
	- **Problema:** Los secretos se comparten ad hoc y el repositorio no guía dónde configurarlos.
	- **Solución:** Documentar variables requeridas y proceso de manejo seguro (environments, vaults, rotación).
	- **Entregables extra:** Script o lintern que verifique que `.env` nunca se comitea.
5. [DEVOPS][M] Configurar ESLint, Prettier, Husky y cambios convencionales para asegurar calidad en cada commit/PR. **Test:** Enseñar ejecución exitosa de `pnpm lint` y `pnpm test --filter tooling` (si aplica) dentro del pipeline pre-push.
	- **Estado:** DONE
	- **Problema:** El repositorio carece de guardrails automáticos, permitiendo estilos inconsistentes y errores básicos.
	- **Solución:** Añadir configuraciones compartidas, hooks de Husky y lint-staged para validar cada commit.
	- **Entregables extra:** Documentación corta de cómo saltar hooks solo para emergencias (sin romper la política).
6. [DEVOPS][L] Construir el API Gateway NestJS (en `apps/backend/api-gateway`) con forwarding, validación centralizada de JWT y **seguridad servicio-a-servicio (API Keys/Signed JWTs)**. **Test:** Ejecutar `pnpm test api-gateway` con suites que cubran rutas sanas, rechazos por JWT inválido y rechazo de tráfico interno no firmado.
	- **Estado:** DONE
	- **Problema:** Los microservicios quedarían expuestos sin capa única de autenticación y rate limiting.
	- **Solución:** Implementar gateway con guards globales, validación de schema y firma de requests internos.
	- **Entregables extra:** Documentar contratos de cabeceras y variables de entorno usadas por el gateway.
7. [BE][M] Scaffold del `auth-service` (NestJS + PostgreSQL) con TypeORM/Prisma y módulo de usuarios/roles. **Test:** `pnpm test auth-service` debe pasar incluyendo pruebas base para entidades y repositorios.
	- **Estado:** DONE
	- **Problema:** No existe un servicio dedicado para gestionar usuarios y roles con persistencia segura.
	- **Solución:** Crear Nest app con capa de persistencia (Prisma o TypeORM), entidades iniciales y migraciones.
	- **Entregables extra:** Script `seed` para crear roles básicos SELLER/COURIER/BUYER.
8. [BE][M] Implementar registro/login JWT para vendedores y repartidores con validaciones y hashing Argon2 en `auth-service`. **Test:** Añadir pruebas de integración con Supertest que cubran signup/login exitoso y errores de validación.
	- **Estado:** DONE
	- **Problema:** Sin flujo de autenticación, ninguna otra app puede validar identidad ni roles.
	- **Solución:** Añadir controladores, DTOs, hashing Argon2, JWT con expiración configurable y refresh tokens.
	- **Entregables extra:** Documentar el shape del payload JWT para que frontend pueda mapear roles.
9. [BE][M] Añadir refresh tokens, recuperación de contraseña y verificación por correo/SMS (stub) en `auth-service`. **Test:** Nuevas pruebas deben simular expiraciones y flujo de recuperación; CI debe mostrar cobertura actualizada.
	- **Estado:** DONE
	- **Problema:** Los usuarios quedarían bloqueados al expirar el token y no existe mecanismo de recuperación.
	- **Solución:** Implementar tabla de refresh tokens, endpoints de forgot/reset y eventos para enviar código vía correo/SMS.
	- **Entregables extra:** Revocar tokens comprometidos y agregar métricas de uso.
10. [BE][M] Configurar `products-service` (NestJS + MongoDB) con esquemas flexibles para catálogos multi-vertical. **Test:** `pnpm test products-service` con pruebas que creen productos con atributos dinámicos.
	- **Estado:** DONE
	- **Problema:** Los vendedores manejan verticales distintos y el modelo rígido impediría atributos personalizados.
	- **Solución:** Definir esquema en Mongo con campos base (nombre, precio, stock) y atributos dinámicos (Mixed) por vertical.
	- **Entregables extra:** Endpoint para describir metadatos por vertical y facilitar render dinámico en frontend.
11. [BE][M] Implementar CRUD de productos y sincronización de stock en `products-service`, incluyendo reservas para órdenes. **Test:** Pruebas de integración deben asegurar consistencia de stock y rollback ante errores.
	- **Estado:** DONE
	- **Problema:** Sin un CRUD completo y reservas, otros servicios no pueden confiar en el stock disponible.
	- **Solución:** Exponer rutas protegidas para crear/editar/eliminar productos y endpoints internos para reservar/liberar stock.
	- **Entregables extra:** Eventos o webhooks para notificar cambios de stock a marketing/logística.
12. [BE][M] Conectar `products-service` con `auth-service` vía API Gateway para controlar permisos por rol. **Test:** Suites e2e deben validar que roles sin permiso reciben 403 y que vendedores válidos acceden.
	- **Estado:** DONE
	- **Problema:** Antes, cualquier request podía modificar productos sin autenticación.
	- **Solución:** Se implementó RolesGuard + validación JWT en API Gateway para filtrar accesos.
	- **Entregables extra:** Mantener documentación de scopes/roles en README.
13. [BE][M] Configurar `finance-service` (NestJS + PostgreSQL) con tablas de órdenes, ledger y comisiones. **Incluir soporte para Patrón Saga (compensaciones) ante fallos distribuidos.** **Test:** `pnpm test finance-service` cubriendo migraciones iniciales, cálculos básicos y rollback lógico.
	- **Estado:** DONE
	- **Problema:** No había forma de registrar órdenes ni contabilidad básica con garantías ACID.
	- **Solución:** Se creó FinanceService con Prisma, ledger y soporte Saga para reversar operaciones.
	- **Entregables extra:** Mantener script de migraciones y seeds alineados.
14. [BE][M] Integrar pasarela local (Mercado Pago u otra) para generar enlaces y códigos QR en `finance-service`. **Test:** Añadir pruebas con mocks HTTP verificando payloads y manejo de errores externos.
	- **Estado:** DONE
	- **Problema:** Los vendedores no podían cobrar sin un link/QR real.
	- **Solución:** Se integró Mercado Pago SDK con servicios y pruebas de mocks.
	- **Entregables extra:** Rotar credenciales en environments y monitorear errores HTTP.
15. [BE][M] Diseñar abstracción para integración P2P USDT (Binance/Paxful) y mock inicial en `finance-service`. **Test:** Tests unitarios deben validar adaptadores múltiples y fallback seguro cuando la API externa falla.
	- **Estado:** DONE
	- **Problema:** La tasa USDT era fija y no se podía cambiar dinamicamente.
	- **Solución:** Se creó P2PService con MockBinanceAdapter y soporte de fallback.
	- **Entregables extra:** Documentar cómo añadir nuevos adaptadores P2P.
16. [BE][M] Configurar `logistics-service` (NestJS + Redis/Valkey) con canales Pub/Sub y almacenamiento geoespacial. **Test:** `pnpm test logistics-service` con pruebas que inserten/lean coordenadas y publiquen eventos.
	- **Estado:** DONE
	- **Problema:** No hay componente que administre ubicaciones y eventos logísticos.
	- **Solución:** Crear microservicio con módulos de geolocalización (Redis GEO) y canales Pub/Sub para broadcast.
	- **Entregables extra:** Scripts para inicializar conjuntos GEO por ciudad.
17. [BE][M] Implementar ingesta de telemetría (ubicaciones de repartidores) y throttling en `logistics-service`. **Test:** Pruebas de carga simulada verifican límites de tasa y almacenamiento correcto.
	- **Estado:** DONE
	- **Problema:** Sin throttling, los repartidores podrían saturar el backend y sin ingesta no hay tracking.
	- **Solución:** Crear endpoints WS/REST para recibir coordenadas, almacenar solo las últimas N y limitar frecuencia por device/token.
	- **Evidencia:** Rate limiting + métricas Prometheus en `apps/backend/logistics-service/src/logistics/logistics.service.ts` y `src/metrics/*` + casos Postman documentados.
	- **Entregables extra:** Métricas Prometheus para tasa de mensajes.
18. [BE][M] Construir flujo de asignación de entregas y actualización de estado en `logistics-service`, emitiendo enlaces de tracking. **Test:** Tests e2e deben recorrer el flujo completo desde pedido hasta entrega, validando eventos.
	- **Estado:** DONE
	- **Problema:** No existe orquestación que asigne pedidos a couriers ni estados visibles para el cliente.
	- **Solución:** Implementar state machine (pending → assigned → picked_up → delivered) y emitir eventos hacia frontend.
	- **Entregables extra:** Endpoint público `/tracking/:id` con token firmado.
19. [DATA][M] Automatizar provisión de bases gratuitas (Aiven PG, Mongo Atlas, Aiven Valkey) con scripts y documentación de credenciales. **Test:** Ejecutar script en modo dry-run mostrando conexiones exitosas y registrar resultados en `docs/data/tenants.md`.
	- **Estado:** TODO
	- **Problema:** El onboarding manual de bases gratuitas es propenso a errores y no deja trazabilidad.
	- **Solución:** Crear script TS/PowerShell que cree bases vía APIs y documente credenciales en tabla controlada.
	- **Entregables extra:** Guía paso a paso para regenerar llaves si expiran.
20. [DEVOPS][M] Escribir Dockerfiles multi-stage para cada microservicio (`apps/backend/*/Dockerfile`) y para la PWA. **Test:** `docker build` por servicio debe completar en CI; adjuntar logs y tamaños de imagen.
	- **Estado:** DONE
	- **Problema:** Sin Dockerfiles no se puede desplegar homogéneo en Fly.io/Render.
	- **Solución:** Crear Dockerfiles multi-stage con `pnpm install --prod` y capas cacheables.
	- **Entregables extra:** Documentar variables de entorno necesarias en cada contenedor.
21. [DEVOPS][L] Publicar los workflows `ci.yml` (lint global + `pnpm test` + build de la PWA con artefacto adjunto) y `docker-build-push.yml` (matriz de microservicios, build multi-stage y push a GHCR). **Test:** PR con enlace al run verde mostrando los jobs `CI / lint`, `CI / test`, `CI / build-pwa` y al menos un `Docker Build & Push` exitoso, más evidencia de artefacto `pwa-dist` descargable.
	- **Estado:** DONE
	- **Problema:** Sin CI centralizado no hay garantía de calidad ni builds reproducibles.
	- **Solución:** Configurar workflows compartidos con caching pnpm, matrices y publicación de artefactos.
	- **Entregables extra:** Badges en README reflejando estado del pipeline.
22. [DEVOPS][M] Crear `deploy-backend-fly.yml` que use `flyctl deploy --config apps/backend/<service>/fly.toml` con secretos en un GitHub Environment protegido. **Test:** Run en CI ejecutando `flyctl deploy --remote-only --strategy immediate` (o `--dry-run`) para cada servicio con `fly.toml`, adjuntando logs verdes en el PR.
	- **Estado:** DONE
	- **Problema:** El despliegue manual a Fly.io es propenso a errores y pierde trazabilidad.
	- **Solución:** Automatizar con workflow que desacople build/deploy y use reviewers en environment.
	- **Entregables extra:** Guía de rollback usando `flyctl releases` documentada.
23. [DEVOPS][M] Crear `deploy-frontend-render.yml` para automatizar el build (`pnpm --filter ./apps/frontend/pwa build`), subir el artefacto y disparar el deploy mediante `RENDER_DEPLOY_HOOK_URL`. **Test:** Registro del run que llama al hook (o captura de Render) y evidencia de que el build adjunto corresponde al commit desplegado.
	- **Estado:** DONE
	- **Problema:** Render se actualiza sólo con pushes manuales, sin control CI.
	- **Solución:** Workflow que reutilice build de CI, adjunte dist y llame al hook de Render con firma.
	- **Entregables extra:** Paso opcional para invalidar CDN y publicar URL del deploy.
24. [FE][M] Scaffold de la PWA (Vite + React + Redux Toolkit + React Router + Service Worker) en `apps/frontend/pwa`. **Test:** `pnpm test pwa` + `pnpm run build` deben pasar y generar artefacto estático.
	- **Estado:** DONE
	- **Problema:** No existe base de frontend lista para roles múltiples ni offline.
	- **Solución:** Iniciar proyecto con Vite, configurar Redux Toolkit, Router, Service Worker y layout base.
	- **Entregables extra:** Guía quickstart para desarrolladores frontend.
25. [FE][M] Implementar onboarding/auth (registro, login, recuperación) consumiendo `auth-service` y guardando tokens. **Test:** Tests de componentes + Playwright deben cubrir flujos de login/forgot password.
	- **Estado:** DONE
	- **Problema:** Sin UI de auth los usuarios no pueden acceder a sus paneles.
	- **Solución:** Construir formularios, RTK Query para auth API y almacenamiento seguro de tokens/refresh.
	- **Entregables extra:** Manejo de errores de red y mensajes localizados.
26. [FE][L] Construir dashboard de inventario (catálogo, carga masiva, gestión de stock en tiempo real) conectado a `products-service` usando **Optimistic UI** para respuesta inmediata. **Test:** Tests de integración deben mockear API y asegurar sincronización visual y reversión ante error; screenshot incluida.
	- **Estado:** DONE
	- **Problema:** Los vendedores no tenían un panel centralizado con estado de stock ni cargas masivas.
	- **Solución:** Se creó Inventory Dashboard con colas offline y Optimistic UI para reflejar cambios instantáneos.
	- **Entregables extra:** Mantener documentación de atajos y soporte para atributos dinámicos.
27. [FE][M] Implementar flujo de checkout/pagos para vendedores con estado de orden y enlaces QR desde `finance-service`. **Test:** Suite e2e debe simular creación de orden, mostrar QR y confirmar actualización de estado.
	- **Estado:** DONE
	- **Problema:** Sin flujo de cobro el vendedor no puede generar órdenes ni QR.
	- **Solución:** Se desarrolló PaymentFlow con keypad, QR y polling seguro.
	- **Entregables extra:** Registrar tutorial rápido para vendedores.
28. [FE][M] Diseñar vista móvil para repartidores (solicitudes en cola, aceptar/declinar, tracking en mapa) usando datos de `logistics-service` y **WebSockets/SSE para alertas real-time**. **Test:** Tests responsivos + Playwright móvil validan notificaciones y flujo.
	- **Estado:** DONE
	- **Problema:** Los couriers carecían de interfaz para recibir pedidos y compartir ubicación.
	- **Solución:** CourierDashboard con mapa, botones de aceptar/declinar y tracking en vivo.
	- **Entregables extra:** Documentar permisos de geolocalización y fallback cuando se niegan.
29. [FE][M] Crear vista pública de tracking para consumidores (estado, ETA, mapa ligero) servida como ruta compartible. **Test:** Tests de snapshot + e2e verifican URL pública y actualizaciones de estado.
	- **Estado:** DONE
	- **Problema:** El comprador no podía seguir su pedido tras pagar.
	- **Solución:** Página pública con mapa Leaflet y timeline de estados.
	- **Entregables extra:** Incluir expiración de enlace y share buttons.
30. [QA][M] Configurar pruebas de integración por microservicio con `@nestjs/testing`, fixtures y base de datos temporal. **Incluir pruebas de latencia/resiliencia (chaos testing básico).** **Test:** Pipeline debe ejecutar suites paralelas contra contenedores efímeros y reportar cobertura.
	- **Estado:** TODO
	- **Problema:** Cada microservicio se prueba manualmente y sin ambientes aislados.
	- **Solución:** Añadir harness `@nestjs/testing` + dockerized DBs para pruebas consistentes y chaos básico.
	- **Entregables extra:** Reporte de cobertura mergeado con Sonar/GitHub.
31. [QA][M] Montar colección Postman/Prism + tests contractuales automatizados en CI para el API Gateway. **Test:** Workflow que ejecute `newman run` (o Prism) y falle si los contratos cambian.
	- **Estado:** TODO
	- **Problema:** Cambios en el gateway pueden romper clientes sin aviso.
	- **Solución:** Crear colección versionada y correrla en CI contra ambiente efímero.
	- **Entregables extra:** Publicar colección en docs para compartir con partners.
32. [OBS][M] Integrar logs estructurados + tracing (OpenTelemetry) y dashboard gratuito (Grafana Cloud o equivalente). **Test:** Captura o enlace al dashboard mostrando métricas y trazas reales.
	- **Estado:** DONE
	- **Problema:** Los servicios loguean texto plano sin contexto ni correlación.
	- **Solución:** Añadir logger estructurado, iniciar trace propagation y exportar a Grafana Cloud gratis.
	- **Entregables extra:** Guía para leer trazas y alertas básicas.
33. [DOC][M] Redactar README principal + `docs/` por microservicio con instrucciones de run/test/deploy. **Test:** Revisar que `README` incluya comandos reproducibles y ejecutar `markdownlint` sin errores.
	- **Estado:** TODO
	- **Problema:** Falta documentación centralizada para nuevos contribuidores.
	- **Solución:** Escribir README general y sub-readmes por servicio con comandos y prerequisitos.
	- **Entregables extra:** Diagrama de arquitectura enlazado desde README.
34. [DOC][M] Documentar manual de operaciones "costo cero" (Fly.io, Render, Aiven, Mongo Atlas) con pasos y límites. **Test:** Publicar `docs/operations/costo-cero.md` y validar que cada paso tenga enlace/ evidencias de sign-up.
	- **Estado:** TODO
	- **Problema:** No hay guía para recrear el stack gratuito; el conocimiento está disperso.
	- **Solución:** Manual paso a paso que incluya límites, pantallazos y enlaces.
	- **Entregables extra:** Checklist de renovación mensual.
35. [DOC][M] Profesionalizar la Developer Experience (DX) con docker-compose, scripts de utilidad y documentación formal en README. **Test:** Ejecutar `./scripts/up.ps1` y verificar que todo el stack levanta correctamente.
	- **Estado:** DONE
	- **Problema:** Levantar el stack requería comandos manuales y poco reproducibles.
	- **Solución:** Se creó docker-compose, scripts automatizados y documentación.
	- **Entregables extra:** Mantener script `down.ps1` y troubleshooting.
36. [Technical Debt][Low] Implementar SanityCheckMiddleware en microservicios internos y tests E2E para hardening. **Test:** Ejecutar suite E2E que demuestre rechazo de peticiones mal formadas.
	- **Estado:** DONE
	- **Problema:** Requests internos pueden degradar servicios si llegan payloads corruptos sin verificación temprana.
	- **Solución:** Crear middleware reutilizable que valide headers básicos, tamaños y formato antes de alcanzar controladores.
	- **Entregables extra:** Documentar cómo habilitar/deshabilitar en entornos locales.
37. [Technical Debt][Hardening] Implementar validación de Body en GET/DELETE en microservicios internos (Defensa en Profundidad) para Q2. **Test:** Nuevas pruebas deben confirmar que requests con body inesperado son rechazadas.
	- **Estado:** DONE
	- **Problema:** Algunos clientes podrían aprovechar GET/DELETE para inyectar cuerpos no deseados sin ser filtrados.
	- **Solución:** Crear guard que rechace bodies en métodos donde no se esperan y registrar incidentes.
	- **Entregables extra:** Checklist de servicios donde se aplica y justificación en excepciones.
38. [FE][M] Vista de Marketplace (Experiencia de Compra) para el rol BUYER. Debe permitir explorar productos y agregarlos al carrito. **Test:** Tests e2e deben simular flujo de compra completo desde selección hasta checkout.
	- **Estado:** DONE
	- **Problema:** Los compradores no cuentan con interfaz dedicada para descubrir productos y comprar.
	- **Solución:** Construir grid responsivo con listados, detalles y botón Añadir al carrito conectado a RTK.
	- **Entregables extra:** Estados de empty/loading y soporte para atributos dinámicos.
39. [FE][M] Gestionar imágenes de producto con subida directa a Cloudinary/Firebase Storage desde `InventoryDashboard` y uso de `imageUrl` real en `MarketplacePage`/`ProductCard`. **Test:** Tests de componentes deben mockear la firma de subida y verificar que se envíe el campo `imageUrl`; Playwright debe cubrir un flujo completo donde se selecciona una imagen, se sube y se visualiza en el Marketplace.
	- **Estado:** TODO
	- **Problema:** El catálogo actual muestra productos sin fotos reales o con placeholders, reduciendo la confianza del comprador y restando contexto visual al vendedor.
	- **Solución:** Añadir input `type="file"`, firmar la subida desde backend y almacenar el `imageUrl` devuelto por Cloudinary/Firebase, persistiendo la referencia en Mongo/Prisma para reutilizarla en todas las vistas.
	- **Entregables extra:** Manejo de estados (loading/error), previsualización y fallback accesible cuando no haya imagen.
40. [FE][BE][M] Construir vistas de historial de órdenes para BUYER ("Mis pedidos") y SELLER ("Ventas recibidas"), leyendo del `finance-service`/`logistics-service` y mostrando estados y totales. **Test:** Suites de integración deben mockear RTK Query y garantizar paginación/filtrado, y un e2e debe comprobar que una compra reciente aparece en ambos dashboards con los estados correctos.
	- **Estado:** TODO
	- **Problema:** Tras pagar, ni compradores ni vendedores tienen visibilidad de pedidos pasados, montos liquidados o estados logísticos.
	- **Solución:** Exponer endpoints `/orders?role=buyer|seller`, normalizar los estados (pending, preparing, on_route, delivered, disputed) y renderizar tablas con filtros por fecha/estado.
	- **Contexto:** Debe enlazarse con Tracking y con el módulo de disputas para abrir tickets desde cada orden.
41. [FE][M] Añadir buscador y filtros facetados (por vertical, precio mínimo/máximo y disponibilidad) en `MarketplacePage` con soporte para debounce y sincronización en la URL. **Test:** Tests de componentes deben verificar que `useGetProductsQuery` reciba los parámetros correctos y que los resultados se filtren localmente; e2e debe cubrir búsqueda por texto y filtros combinados.
	- **Estado:** TODO
	- **Problema:** El marketplace lista todos los productos sin herramientas de descubrimiento, volviéndose inmanejable a medida que crece el catálogo.
	- **Solución:** Implementar barra de búsqueda con debounce, controles de rango y chips de vertical, sincronizados en query params para compartir links filtrados.
	- **Notas:** Preparar datos para futura integración con Meilisearch (task 63).
42. [FE][BE][M] Implementar un centro de mensajes por orden (Buyer ↔ Seller ↔ Courier) usando un thread asociado al `orderId`, con notificaciones in-app en tiempo real. **Test:** Pruebas de contrato para el nuevo endpoint `/orders/:id/messages`, unitarias para el reducer de chat y e2e donde los tres roles intercambian mensajes.
	- **Estado:** Done
	- **Problema:** No existe canal oficial para coordinar cambios de dirección, horarios o incidencias entre las tres partes.
	- **Solución:** Crear modelo `OrderMessage` con remitente, rol y timestamp; exponer sockets para streaming y persistirlos para auditoría.
	- **Extras:** Validar permisos (solo miembros de la orden) y mostrar estatus de mensaje leído.
43. [BE][Finance][M] Reemplazar el mock de P2P con un adaptador real de tasas (Binance y CoinGecko) con fallback y cacheo de 60s. **Test:** Tests unitarios deben mockear ambas APIs y verificar selección/fallback, y un test de integración debe asegurar que `finance-service` calcula montos usando tasas reales.
	- **Estado:** Done
	- **Problema:** La tasa de cambio usada para USDT/PEN (u otras monedas) es fija o aleatoria, lo que resta credibilidad financiera.
	- **Solución:** Implementar adaptadores `BinanceRatesAdapter` y `CoinGeckoRatesAdapter` con cache en Redis y failover si una API cae.
	- **Objetivo:** Mostrar en UI el origen de la tasa y hora de obtención para transparencia.
44. [BE][Auth][M] Integrar envío real de correos (Resend/EmailJS) para bienvenida, verificación y recuperación, con plantillas versionadas. **Test:** Tests unitarios deben validar que se llama al proveedor con payload correcto y un test end-to-end debe simular el flujo de "olvidé mi contraseña" recibiendo el correo en una bandeja de prueba (MailHog).
	- **Estado:** Done
	- **Problema:** Los correos de onboarding y recuperación solo se loguean en consola; no llegan al usuario.
	- **Solución:** Conectar `auth-service` a Resend/EmailJS usando claves safe, almacenar templates en `templates/emails/` y registrar envíos para auditoría.
	- **Detalle:** Incluir enlaces firmados con expiración para reset/verify.
45. [BE][Logistics][M] Conectar `logistics-service` con OSRM (Open Source Routing Machine) para calcular rutas reales y ETAs en lugar de mocks. **Test:** Tests de integración deben invocar un contenedor OSRM en CI y validar que la ruta y duración sean mayores a cero; pruebas de contrato deben asegurar manejo de errores. (FALTA DESPLIGUE CON DOCKER)
	- **Estado:** Done
	- **Problema:** Los tiempos estimados y rutas en Tracking se basan en números aleatorios, afectando la experiencia "tipo Uber".
	- **Solución:** Desplegar OSRM (o consumir una instancia pública) y consultar rutas reales usando coordenadas reales.
	- **Notas:** Cachear respuestas por segmento y manejar fallbacks cuando OSRM esté caído.
46. [FE][Logistics][M] Agregar "Proof of Delivery" en la app del courier: captura de foto y/o firma digital antes de marcar un pedido como entregado, almacenando la evidencia en Storage. **Test:** Tests de componentes deben validar el manejo de canvas/base64 y un e2e debe demostrar que una entrega no se marca como completada si falta la evidencia.
	- **Estado:** TODO
	- **Problema:** Las entregas se marcan manualmente sin evidencia, abriendo la puerta a fraudes y disputas sin soporte visual.
	- **Solución:** Incluir captura de cámara (via Capacitor/MediaDevices) o firma en canvas, subir a Storage y adjuntar referencia a la orden.
	- **Impacto:** Habilita pruebas en disputas y transparencia para compradores/administradores.
47. [FE][BE][M] Diseñar sistema de reputación (ratings & reviews) para Sellers y Couriers, mostrando promedios y comentarios en `ProductCard` y `CourierProfile`. **Test:** Tests unitarios deben calcular promedios correctamente, y un e2e debe dejar una review tras un pedido y verla reflejada en el catálogo.
	- **Estado:** TODO
	- **Problema:** No hay forma de evaluar calidad de servicio; los compradores no pueden diferenciar vendedores/couriers confiables.
	- **Solución:** Crear entidad `Review` con rating 1-5, comentarios y rol destino; actualizar vistas para mostrar promedios y cantidad de reseñas.
	- **Consideraciones:** Validar que solo órdenes entregadas permitan dejar review y evitar spam con límites.
48. [FE][M] Construir centro de notificaciones (campana en `MainLayout`) que escuche eventos (websocket) y persista un feed local de cambios (orden aceptada, pago acreditado, etc.). **Test:** Unit tests para el slice de notificaciones y un e2e donde se reciben al menos dos eventos y se muestran badges.
	- **Estado:** TODO
	- **Problema:** Los usuarios no reciben alertas en la UI cuando cambia el estado de una orden; dependen de refrescar manualmente.
	- **Solución:** Implementar panel lateral o modal con feed persistente, badges de conteo y conexión a sockets/event-bus.
	- **Extras:** Integrar con tareas 42 y 50 para recibir tanto chat como eventos logísticos.
49. [FE][M] Implementar "Address Book" para compradores, permitiendo guardar direcciones (Casa/Trabajo) y reutilizarlas en checkout con validación y geocodificación. **Test:** Tests de componentes deben garantizar validación y persistencia en backend; e2e debe cubrir agregar dirección y seleccionarla al pagar.
	- **Estado:** TODO
	- **Problema:** El checkout obliga a escribir la dirección completa cada vez, incrementando fricción y errores.
	- **Solución:** Crear entidad `SavedAddress` con etiquetas personalizables, validarla (geocoding/Leaflet) y mostrar selector rápido en checkout.
	- **Notas:** Permitir marcar una dirección predeterminada y editar/borrar registros.
50. [FE][BE][L] Migrar los flujos críticos (tracking, finanzas, chat) de polling a WebSockets/SSE con `logistics.gateway.ts` para real-time estable y eficiente. **Test:** Pruebas de carga deben demostrar menor throughput HTTP, unit tests deben cubrir reconexión y un e2e debe mostrar actualizaciones sin refrescar.
	- **Estado:** TODO
	- **Problema:** El sistema depende de polling agresivo, que gasta batería/datos y genera latencia perceptible.
	- **Solución:** Extender `logistics.gateway.ts`/`finance-service` con canales WS/SSE, manejar reconexión y fallback a polling solo cuando WS no esté disponible.
	- **Resultado esperado:** Mapas y estados cambian en tiempo real como en apps tipo Uber/Rappi.
51. [FE][OBS][M] A�adir Web Push Notifications (FCM o Web Push API) para alertar a usuarios incluso con la PWA cerrada, respetando permisos y topics por rol. **Test:** Integration tests usando `web-push` mock deben validar el payload y un flujo manual debe mostrar recepción de notificación en Chrome.
	- **Estado:** TODO
	- **Problema:** Si el usuario cierra la PWA no recibe avisos en tiempo real.
	- **Solución:** Registrar service worker con FCM/Web Push, gestionar topic por rol (seller, courier, buyer) y enviar mensajes desde notification-service.
	- **Consideraciones:** Manejar suscripción/opt-out y renovaciones de tokens.
52. [QA][M] Configurar suite end-to-end con Playwright (desktop + mobile) cubriendo login, creación de producto, compra, asignación logística y entrega. **Test:** `pnpm test:e2e` debe correr en CI generando videos/screenshots anexos.
	- **Estado:** TODO
	- **Problema:** No existe evidencia automatizada de que los flujos principales sigan funcionando tras cada PR.
	- **Solución:** Definir fixtures de datos, scripts para seed y escenarios Playwright que cubran los tres roles (seller, buyer, courier).
	- **Meta:** Integrar en CI con artefactos (videos/logs) para debugging rápido.
53. [OBS][M] Instrumentar Sentry (errores) y PostHog (analytics/feature flags) en frontend y backend con scrubbing de datos sensibles. **Test:** Tests unitarios deben asegurar que el cliente se inicializa con DSN env, y un smoke manual debe registrar un evento y una sesión real en ambos paneles.
	- **Estado:** TODO
	- **Problema:** Incidentes en producción pasan desapercibidos y no se registran métricas de uso real.
	- **Solución:** Integrar SDKs de Sentry/PostHog en PWA y microservicios, anonimizar PII y definir eventos clave (checkout_started, delivery_assigned, dispute_opened).
	- **Seguimiento:** Documentar paneles y alertas mínimas.
54. [BE][OBS][L] Crear `notification-service` dedicado (NestJS) que consuma eventos (order_created, delivery_assigned, payment_settled) y despache emails, push y notificaciones in-app desde un solo lugar (puede usar Novu). **Test:** Contract tests deben verificar payloads emitidos y un e2e debe mostrar que al crear una orden se generan al menos dos canales (in-app + email).
	- **Estado:** TODO
	- **Problema:** Cada microservicio envía notificaciones por su cuenta, duplicando lógica y siendo difícil de auditar.
	- **Solución:** Introducir microservicio event-driven con colas (Redis Streams/Valkey) que orquesta Resend, Web Push y notificaciones internas.
	- **Notas:** Integrar con tareas 48 y 51.
55. [BE][DATA][M] Implementar Idempotency Keys en `finance-service` y locking optimista/pesimista en `products-service` para evitar pagos duplicados y stock negativo. **Test:** Tests de concurrencia deben simular dos compras simultáneas del mismo producto y garantizar que una falle elegantemente.
	- **Estado:** TODO
	- **Problema:** Si el usuario reintenta pago por mala conectividad se puede cobrar dos veces; dos compradores pueden dejar el stock en negativo.
	- **Solución:** Exigir `Idempotency-Key` en cabeceras y usar versiones/bloqueos `findAndModify` en Mongo para stock.
	- **Resultado:** Ledger consistente y sin ventas duplicadas.
56. [PM][FE][BE][M] Montar un Backoffice/Admin (Refine.dev o React Admin) con autenticación de super-user para moderar catálogos, revisar disputas y bloquear usuarios. **Test:** Playwright debe cubrir login admin y acciones CRUD; unit tests deben proteger permisos.
	- **Estado:** TODO
	- **Problema:** Operaciones críticas (banear usuarios, aprobar KYC, liberar fondos) solo pueden hacerse manipulando la DB manualmente.
	- **Solución:** Usar framework admin (Refine/React Admin) conectado al API Gateway con rol `SUPER_ADMIN`, con vistas para usuarios, productos, pedidos y disputas.
	- **Notas:** Auditar cada acción en AuditLogs (task 61).
57. [FE][M] Internacionalizar la PWA usando i18next (es/en) y centralizar copy en archivos de traducción. **Test:** Tests de snapshot deben generar vistas en ambos idiomas y Lighthouse debe reportar strings traducidos.
	- **Estado:** TODO
	- **Problema:** Todos los textos están hardcodeados en español, dificultando expansión regional.
	- **Solución:** Introducir i18next, dividir strings por dominio y permitir toggles dinámicos guardados en localStorage.
	- **Notas:** Coordinar con QA para asegurar accesibilidad en ambos idiomas.
58. [FE][M] Diseñar UI de resolución de conflictos offline (cuando `OfflineSyncManager` detecte conflicto 409) mostrando diferencias lado a lado y permitiendo elegir versión o merge. **Test:** Tests de reducers deben cubrir estados de conflicto y un e2e debe emular edición offline seguida de conflicto.
	- **Estado:** TODO
	- **Problema:** Si dos usuarios editan el mismo producto y existe conflicto, el error solo muestra un toast sin herramienta para resolverlo.
	- **Solución:** Renderizar modal comparativo (versión local vs servidor) con opción de sobrescribir o combinar campos, registrando auditoría.
	- **Beneficio:** Evita pérdida de trabajo y mantiene catálogos limpios.
59. [BE][Finance][L] Añadir flujo de disputas y fondo escrow: congelar fondos tras pago, permitir que el comprador abra disputa y que un admin libere fondos a vendedor o comprador con registros auditables. **Test:** Tests de integración deben recorrer el ciclo completo y asegurar que ledger/escrow se actualicen correctamente.
	- **Estado:** TODO
	- **Problema:** Hoy el dinero se liquida al vendedor inmediatamente, sin protección al comprador.
	- **Solución:** Introducir estados `ESCROW_HELD`, endpoints para abrir disputa, adjuntar evidencias (ver task 46) y panel admin para liberar fondos.
	- **Notas:** Integrar con notificaciones y historiales.
60. [BE][Finance][M] Implementar motor de comisiones configurable (por vertical o campaña) que separe automáticamente la porción de la plataforma al liquidar órdenes. **Test:** Unit tests deben validar múltiples reglas y un test de integración debe mostrar el split del pago en ledger.
	- **Estado:** TODO
	- **Problema:** La plataforma no captura ingresos; todos los fondos van al vendedor.
	- **Solución:** Definir reglas (% base, mínimos, promos) y aplicar split en ledger/transacciones con cuentas contables separadas.
	- **Extras:** Exponer en Backoffice para ajustes rápidos.
61. [SEC][M] Agregar auditoría (AuditLogs) e indicadores KYC: permitir subir documentos, estados `UNVERIFIED/PENDING/VERIFIED` y almacenar cada cambio con quién/cuándo/qué. **Test:** Tests unitarios deben validar creación de logs y un e2e debe cubrir subida de documento y cambio de estado.
	- **Estado:** TODO
	- **Problema:** No existe rastro histórico de quién cambia datos sensibles ni mecanismo mínimo de verificación de identidad.
	- **Solución:** Añadir tabla `audit_logs`, API para subir documentos KYC y workflow manual de aprobación.
	- **Observación:** Requisito previo para operar cobros reales y panel admin (task 56).
62. [SEC][M] Habilitar rate limiting a nivel API Gateway con `@nestjs/throttler`, listas allow/deny y métricas, protegiendo endpoints públicos. **Test:** Tests de integración deben simular 200 peticiones/min y verificar que se rechacen acorde a la política.
	- **Estado:** TODO
	- **Problema:** La API puede ser abusada por bots/DDoS sin ninguna defensa perimetral.
	- **Solución:** Configurar throttler global + whitelists/blacklists, exponer métricas y alertar cuando se superen umbrales.
	- **Extras:** Documentar límites en README/Swagger.
63. [DATA][M] Integrar Meilisearch (o Algolia) como motor de búsqueda semántica para productos, con sinónimos y tolerancia a typos. **Test:** Tests de contrato deben indexar fixtures y validar respuestas de la API de búsqueda.
	- **Estado:** TODO
	- **Problema:** Las búsquedas actuales dependen de filtros básicos; no toleran typos ni ofrecen relevancia.
	- **Solución:** Sincronizar productos con Meilisearch/Algolia usando webhooks/background jobs y exponer endpoint `/search` consumido por la PWA.
	- **Objetivo:** Soportar autocompletado, orden por popularidad y sinónimos locales.
64. [FE][DEVOPS][M] Empaquetar la PWA con Capacitor para publicar builds Android/iOS (sin App Stores aún) habilitando acceso a APIs nativas como geolocalización background. **Test:** CI debe generar `android`/`ios` builds y un smoke manual debe instalar el APK en un emulador.
	- **Estado:** TODO
	- **Problema:** El courier necesita tracking en background, pero la PWA pura está limitada por restricciones del navegador.
	- **Solución:** Añadir Capacitor al repo, configurar proyectos Android/iOS y exponer APIs nativas (camera, background geo, push).
	- **Notas:** Preparar documentación para envío futuro a stores.
65. [FE][QA][S] Ejecutar auditoría completa de accesibilidad (A11y) y remediar contrastes, navegación por teclado y etiquetas ARIA, documentando resultados. **Test:** Lighthouse accesibility ≥ 95 y jest-axe sin violaciones críticas.
	- **Estado:** TODO
	- **Problema:** No hay garantías de cumplimiento A11y; usuarios con discapacidad podrían no completar flujos críticos.
	- **Solución:** Correr Lighthouse/jest-axe, corregir foco, contraste, etiquetas ARIA y atajos de teclado; documentar mejoras.
	- **Resultado:** Reporte adjunto y checklist mantenido en docs.
66. [DOC][BE][M] Documentar la API pública con Swagger/OpenAPI (decoradores `@ApiProperty`, `@ApiOperation`) y exponer `/docs` para cada microservicio. **Test:** Tests unitarios deben asegurar que el módulo Swagger se inicializa y un smoke debe capturar `/docs` corriendo en CI.
	- **Estado:** TODO
	- **Problema:** Los consumidores (frontend, socios externos) dependen de Postman/manuales; no hay documentación viva.
	- **Solución:** Habilitar SwaggerModule en cada servicio, versionar esquemas y proteger endpoints con auth básica.
	- **Extras:** Publicar enlaces en README/Backoffice y mantenerlos sincronizados con releases.


	
### ¡Excelente avance! 👏👏 He revisado los archivos y tienes código de nivel Senior aquí. Has aplicado patrones de diseño defensivos y una UX muy pulida.

Sin embargo, hay un detalle crítico en tu docker-compose.yml que evitará que el sistema funcione completo.

Aquí está el análisis de tu entrega:

1. El Frontend (ProductCard.tsx) 🎨
Estado: ⭐⭐⭐⭐⭐ (Perfecto)

Tu implementación es impecable:

✅ Optimización Cloudinary: La función getOptimizedUrl inyecta dinámicamente w_500,h_500,c_fill,q_auto. Esto hará que tu app cargue instantáneamente incluso con conexiones lentas en Venezuela.

✅ UX Robusta: Tienes el Skeleton Loader (animate-pulse) para la espera y el manejo de errores (onError) para que nunca se vea un icono roto.

✅ Diseño: El uso de aspect-square y object-cover resolverá definitivamente el problema de las imágenes estiradas o de diferentes tamaños.

2. El Backend (osrm.service.ts) 🧠
Estado: ⭐⭐⭐⭐⭐ (Excelente Ingeniería)

Me encanta el patrón de "Fallback" que implementaste:

Intentas conectar con OSRM local.

Si OSRM falla (o el contenedor se cae), no rompes la app. Automáticamente calculas la distancia "Haversine" (línea recta) y estimas el tiempo a 30km/h.

Esto es "Defensive Programming" puro. En una defensa de tesis, si Docker falla, tu profesor ni se dará cuenta porque el sistema seguirá respondiendo.

3. La Infraestructura (docker-compose.yml) ⚠️
Estado: ❌ Incompleto

En el archivo docker-compose.yml que compartiste, FALTAN los servicios nuevos. Solo veo Postgres, Mongo y Redis.

Aunque creaste el archivo OSRM_SETUP.md con las instrucciones, no has agregado los bloques al docker-compose.yml real. Si ejecutas docker compose up ahora, OSRM no levantará.

👉 Acción Requerida: Agrega esto al final de tu docker-compose.yml (respetando la indentación de services):

YAML

  # ... debajo de redis ...

  # Servicio de Enrutamiento (Mapas) - Tarea 45
  osrm:
    image: osrm/osrm-backend
    container_name: puente-dev-osrm
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - ./docker/osrm/data:/data  # Asegúrate que esta ruta coincida con donde bajaste el mapa
    command: "osrm-routed --algorithm mld /data/venezuela-latest.osrm"
    networks:
      - puente-dev

  # Servicio de Pruebas de Correo - Tarea 44
  mailhog:
    image: mailhog/mailhog
    container_name: puente-dev-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025" # SMTP (Para el Backend)
      - "8025:8025" # Web UI (Para ti)
    networks:
      - puente-dev
Resumen de Próximos Pasos 🚀
Copia y pega el bloque de arriba en tu docker-compose.yml.

Asegúrate de que la ruta /data/venezuela-latest.osrm coincida con el nombre del archivo que generaste (en tu MD mencionas venezuela-251206.osrm, ajusta el nombre en el yaml si es necesario).

Reinicia todo:

PowerShell

docker compose up -d
Entra a http://localhost:8025 para confirmar que MailHog vive.

Haz un curl o prueba a http://localhost:5000 para confirmar que OSRM vive.

¡Estás a nada de tener la infraestructura completa! ¿Hacemos el ajuste del yaml?


### ¡Vas muy bien! Has arreglado el problema de Git y el código del Frontend y Backend se ve sólido. 🛡️

Sin embargo, al revisar tu archivo docker-compose.yml, noté que te falta el paso final para que todo esto funcione en conjunto.

Aquí tienes el reporte de estado actual basado en los archivos que subiste:

1. .gitignore ✅ (Solucionado)
¡Perfecto! Has añadido las reglas para ignorar los mapas gigantes (*.osm.pbf, /docker/osrm/data/*).

Resultado: Ya no tendrás problemas al hacer git push y tu repositorio se mantendrá ligero.

2. Frontend (ProductCard.tsx) ✅ (Excelente)
Tu implementación es de nivel profesional:

Optimización: Usas getOptimizedUrl para pedir imágenes de 500x500 a Cloudinary.

Diseño: Tienes aspect-square y object-cover para que la grilla sea uniforme.

UX: Incluiste el estado de carga (animate-pulse) y manejo de errores. ¡Esto se verá genial!

3. Backend (osrm.service.ts) ✅ (Muy bien)
La lógica es robusta. Tienes un sistema "a prueba de balas":

Intentas contactar a OSRM local.

Si falla, calculas la distancia matemáticamente (Haversine) para no dejar al usuario sin respuesta.

⚠️ LO QUE FALTA (Crítico): docker-compose.yml
Aunque tienes el código para consumir OSRM y MailHog, no has agregado los contenedores a tu infraestructura. Tu archivo docker-compose.yml actual solo tiene Postgres, Mongo y Redis.

Si corres la app ahora:

El backend intentará conectar a http://localhost:5000 (OSRM).

Fallará (porque no existe).

Usará siempre el "Fallback" (línea recta), perdiendo la precisión de las rutas reales.

👉 Acción Inmediata: Copia y pega esto al final de tu docker-compose.yml (asegúrate de que esté alineado con services:):

YAML

  # ... (después del servicio redis)

  osrm:
    image: osrm/osrm-backend
    container_name: puente-dev-osrm
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - ./docker/osrm/data:/data
    command: "osrm-routed --algorithm mld /data/venezuela-latest.osrm"
    networks:
      - puente-dev

  mailhog:
    image: mailhog/mailhog
    container_name: puente-dev-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - puente-dev
Una vez agregues esto, ejecuta: docker compose up -d

¡Con eso tu sistema estará 100% operativo! ¿Te ayudo con la siguiente tarea (Reviews) una vez corrijas esto?

### Variables de Entorno Necesarias
# Task 51 - Web Push
VITE_VAPID_PUBLIC_KEY=BN...

### Task 53 - Observability
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_POSTHOG_KEY=phc_xxx

### Tasks 54, 55 - Notification Service
REDIS_URL=redis://localhost:6379
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=...

?? ALERTA CR�TICA DE INFRAESTRUCTURA ??
Tienes demasiado c�digo nuevo que no est� reflejado en tu infraestructura local.

Tu archivo docker-compose.yml NO SE HA ACTUALIZADO acorde a tu avance.

Si intentas correr el proyecto hoy, fallar� masivamente porque:

Falta OSRM y MailHog: (Lo que hablamos antes, a�n no est�n).

Falta notification-service: Creaste un microservicio entero nuevo, pero Docker no sabe que existe. No se levantar�.

Falta frontend-admin: El panel de administraci�n nuevo tampoco est� en el compose.

Tu docker-compose.yml NECESITA verse as� para soportar hasta la Tarea 59:

YAML

version: '3.9'
# ... (tus bloques x-otel-env existen, bien)

services:
  # ... (postgres, mongo, redis existen, bien) ...

  # 1. AGREGAR OSRM (Task 45)
  osrm:
    image: osrm/osrm-backend
    container_name: puente-dev-osrm
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - ./docker/osrm/data:/data
    command: "osrm-routed --algorithm mld /data/venezuela-latest.osrm"
    networks:
      - puente-dev

  # 2. AGREGAR MAILHOG (Task 44)
  mailhog:
    image: mailhog/mailhog
    container_name: puente-dev-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - puente-dev

  # 3. AGREGAR NOTIFICATION SERVICE (Task 54)
  notification-service:
    build:
      context: .
      dockerfile: apps/backend/notification-service/Dockerfile
    container_name: puente-backend-notification
    restart: unless-stopped
    ports:
      - "3005:3005" # Asumiendo puerto 3005
    environment:
      <<: *otel-env
      # Agrega aqu� las vars de Redis/Email/Push
    depends_on:
      - redis
    networks:
      - puente-dev

  # 4. (Opcional) AGREGAR ADMIN PANEL (Task 56)
  admin:
    build:
      context: apps/frontend/admin # Ajustar contexto si es necesario
      dockerfile: Dockerfile # Aseg�rate de tener Dockerfile para admin
    ports:
      - "5174:80" # Puerto diferente a la PWA (5173)
    networks:
      - puente-dev
Conclusi�n: Has programado una barbaridad (�Felicidades! ??). Tienes el c�digo de un sistema muy complejo. Ahora solo te falta actualizar el orquestador (Docker) para que todas estas piezas nuevas puedan hablar entre s�.

### Task 63 env
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey

Que al abrir me mande al login
Duraci�n del token es muy corta, y cuando expire que me mande al login
