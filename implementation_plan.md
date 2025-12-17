# 🎯 Plan de Integración UI/UX - Puente Platform

> **Objetivo:** Conectar todas las funcionalidades dispersas en una experiencia de usuario coherente y navegable.
> **Última actualización:** 2025-12-14

---

## 📊 Estado Actual del Proyecto

### ✅ Completado

| Funcionalidad              | Estado | Detalles                                                         |
| -------------------------- | ------ | ---------------------------------------------------------------- |
| Flujo de creación de orden | ✅     | BUYER puede crear órdenes desde Marketplace                      |
| Mis Compras (BUYER)        | ✅     | Órdenes visibles con sellerId correcto                           |
| Mis Ventas (SELLER)        | ✅     | Órdenes recibidas visibles                                       |
| OrderDetailsPage           | ✅     | Página de detalles completa en `/orders/:orderId`                |
| Dispatch Flow Backend      | ✅     | `POST /orders/:id/dispatch` cambia status a PROCESSING           |
| Available Jobs Endpoint    | ✅     | `GET /orders/available-jobs` para couriers                       |
| Dark Mode TrackingPage     | ✅     | PublicLayout y TrackingPage con dark mode                        |
| UX Botones Claros          | ✅     | "Ver Tracking" solo para shipped, "Ver Detalles" siempre visible |
| Direcciones en Profile     | ✅     | CRUD de direcciones funcionando                                  |

### 🔄 En Progreso / Parcial

| Funcionalidad      | Estado | Detalles                                                               |
| ------------------ | ------ | ---------------------------------------------------------------------- |
| Courier Job List   | 🔄     | LogisticsPage muestra órdenes disponibles pero falta probar end-to-end |
| Courier Accept Job | 🔄     | Endpoint existe pero frontend necesita testing                         |

### ❌ Pendiente

| Funcionalidad                        | Prioridad | Descripción                                           |
| ------------------------------------ | --------- | ----------------------------------------------------- |
| **Courier: Aceptar trabajo**         | 🔴 ALTA   | Al aceptar, assign courier y cambiar status a SHIPPED |
| **Courier: Ver trabajos asignados**  | 🔴 ALTA   | Lista de órdenes que el courier ya aceptó             |
| **Courier: Completar entrega (POD)** | 🔴 ALTA   | Foto/firma como prueba de entrega                     |
| **Tracking en tiempo real**          | 🟡 MEDIA  | WebSocket con ubicación del courier                   |
| Reviews post-entrega                 | 🟡 MEDIA  | Buyer puede dejar review tras DELIVERED               |
| NotificationBell en header           | 🟢 BAJA   | Componente existe, falta integrar                     |
| ConflictResolver offline             | 🟢 BAJA   | Modal para resolver conflictos sync                   |

---

## 🚚 PRIORIDAD: Flujo Completo del COURIER

El repartidor actualmente **no puede hacer nada útil**. Necesita:

### Tarea 1: Ver Trabajos Disponibles ✅

```
Estado: COMPLETADO
- GET /orders/available-jobs retorna órdenes con status=PROCESSING y sin courierId
- LogisticsPage llama a este endpoint y muestra las órdenes
```

### Tarea 2: Aceptar Trabajo 🔴

```
Estado: PENDIENTE VERIFICACIÓN
Endpoint: PATCH /orders/:id/assign-courier
- El courier se auto-asigna (x-user-id header)
- Status cambia a SHIPPED
Frontend: LogisticsPage ya tiene botón "Aceptar Trabajo"
Falta: Probar end-to-end, actualizar UI tras aceptar
```

### Tarea 3: Ver Mis Trabajos Asignados 🔴

```
Estado: PENDIENTE
- Courier debe ver órdenes donde courierId === su userId
- Mostrar en sección separada "Mis Entregas Activas"
- Endpoint existe: GET /orders/courier
Frontend: LogisticsPage debe separar:
  - Trabajos Disponibles (no asignados)
  - Mis Entregas (asignados a mí)
```

### Tarea 4: Navegar a Pickup/Delivery 🔴

```
Estado: PENDIENTE
- Mostrar mapa con ruta desde ubicación actual → pickup → delivery
- Integrar con OSRM para rutas reales
- Botones "Iniciar Navegación" (Google Maps/Waze)
```

### Tarea 5: Completar Entrega (POD) 🔴

```
Estado: PENDIENTE
Endpoint: POST /orders/:id/complete-delivery (ya existe)
Requiere:
  - photoBase64 o signatureBase64 (al menos uno)
  - GPS location opcional
Backend: Sube a Cloudinary, marca como DELIVERED
Frontend: Crear modal/página con:
  - Cámara para foto
  - Canvas para firma
  - Botón "Confirmar Entrega"
```

---

## 🗺️ Mapa de Navegación por Rol

### SELLER (Vendedor)

```
[🏠 Inicio] [📦 Inventario] [💰 Mis Ventas] [💳 Cobrar]

Mis Ventas:
  → Click en orden → OrderDetailsPage
  → Botón "Enviar a Repartidor" (si pending) ✅
  → Ver status del pedido
```

### BUYER (Cliente)

```
[🏠 Inicio] [🛒 Comprar] [📋 Mis Compras]

Mis Compras:
  → Click en orden → OrderDetailsPage ✅
  → "Ver Tracking" (si shipped) → TrackingPage
  → "Dejar Review" (si delivered) → ❌ PENDIENTE
```

### COURIER (Repartidor)

```
[🚚 Envíos]

Envíos:
  → Trabajos Disponibles (órdenes PROCESSING sin courier) ✅
  → "Aceptar Trabajo" → asigna courier 🔄
  → Mis Entregas Activas (órdenes SHIPPED mías) → ❌ PENDIENTE
  → "Completar Entrega" → POD flow → ❌ PENDIENTE
```

---

## 📋 Componentes Huérfanos (Pendientes de Integrar)

| Componente             | Ubicación               | Acción Requerida                      |
| ---------------------- | ----------------------- | ------------------------------------- |
| ReviewForm.tsx         | features/reviews/       | Integrar en OrdersPage post-delivered |
| ReviewsList.tsx        | features/reviews/       | Mostrar en ProductCard                |
| NotificationBell.tsx   | features/notifications/ | Agregar a MainLayout header           |
| NotificationCenter.tsx | features/notifications/ | Página /notifications                 |
| ConflictResolver.tsx   | features/sync/          | Conectar a OfflineSyncManager         |

---

## ✅ Checklist de Verificación

### Flujo SELLER

- [x] Puede crear producto
- [x] Ve órdenes en Mis Ventas
- [x] Puede abrir detalles de orden
- [x] Puede despachar orden a repartidor

### Flujo BUYER

- [x] Puede buscar productos
- [x] Puede agregar al carrito
- [x] Puede crear orden (checkout)
- [x] Ve órdenes en Mis Compras
- [x] Puede ver detalles de orden
- [ ] Puede ver tracking en tiempo real
- [ ] Puede dejar review post-entrega

### Flujo COURIER

- [x] Ve trabajos disponibles
- [ ] Puede aceptar trabajo (needs testing)
- [ ] Ve sus entregas asignadas
- [ ] Puede ver ruta en mapa
- [ ] Puede marcar como entregado (POD)

---

## 🎬 Próximos Pasos Recomendados

1. **Testear flujo courier end-to-end** - Crear orden, dispatch, ver en LogisticsPage, aceptar
2. **Separar trabajos en LogisticsPage** - Disponibles vs Mis Entregas
3. **Implementar POD Flow** - Cámara + firma + upload
4. **Integrar Reviews** - Post-delivered para buyers
5. **NotificationBell** - Agregar al header
