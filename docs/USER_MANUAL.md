# 📖 Manual de Usuario - Puente Platform

> **Versión:** 1.0.0  
> **Última actualización:** 2025-12-10

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Roles de Usuario](#roles-de-usuario)
3. [Manual del Vendedor (SELLER)](#manual-del-vendedor-seller)
4. [Manual del Comprador (BUYER)](#manual-del-comprador-buyer)
5. [Manual del Repartidor (COURIER)](#manual-del-repartidor-courier)
6. [Funcionalidades Comunes](#funcionalidades-comunes)

---

## Introducción

Puente es una plataforma Progressive Web App (PWA) diseñada para conectar vendedores informales con compradores y repartidores locales. La aplicación permite:

- **Vendedores:** Gestionar inventario, recibir pagos digitales, coordinar entregas
- **Compradores:** Buscar productos, comprar, rastrear pedidos
- **Repartidores:** Recibir trabajos de entrega, ver rutas, confirmar entregas

---

## Roles de Usuario

| Rol         | Descripción          | Email de prueba              |
| ----------- | -------------------- | ---------------------------- |
| **SELLER**  | Vendedor/Comerciante | `maria_vendedora@puente.com` |
| **BUYER**   | Comprador/Cliente    | `carlos_cliente@puente.com`  |
| **COURIER** | Repartidor/Mensajero | `luis_repartidor@puente.com` |

**Contraseña de prueba:** `password123`

---

## Manual del Vendedor (SELLER)

### 🏠 Dashboard (Inicio)

Al iniciar sesión, verás un resumen con:

- Total de ventas del día
- Órdenes pendientes
- Estadísticas rápidas

### 📦 Inventario

**Ruta:** `/inventory`

Gestiona tu catálogo de productos:

1. **Ver productos:** Lista todos tus productos con imagen, precio y stock
2. **Crear producto:**
   - Click en "+ Nuevo Producto"
   - Completa: nombre, descripción, precio, SKU, stock
   - Sube una imagen (se almacena en Cloudinary)
   - Agrega tags para categorizar
3. **Editar producto:** Click en el producto → modifica campos → Guardar
4. **Gestionar stock:** Actualiza el stock disponible en tiempo real

### 💰 Mis Ventas

**Ruta:** `/orders`

Visualiza las órdenes que has recibido:

1. **Filtrar por estado:** Pendiente, Procesando, Enviado, Entregado, Cancelado
2. **Ver detalles:** Click en una orden para ver productos, cliente, dirección
3. **Cambiar estado:** Mueve la orden al siguiente estado del flujo

### 💳 Cobrar

**Ruta:** `/checkout`

Genera enlaces de pago para cobrar a tus clientes:

1. **Selecciona productos** del inventario
2. **Genera link de pago** o código QR
3. **Comparte** con tu cliente vía WhatsApp u otras apps

### 📊 Finanzas

**Ruta:** `/finance`

Revisa tu balance y transacciones:

1. **Balance actual:** Dinero disponible para retirar
2. **Historial:** Lista de transacciones con fecha y monto
3. **Tasas P2P:** Conversión a USDT con tasas de Binance/CoinGecko

### 🚚 Envíos

**Ruta:** `/logistics`

Gestiona las entregas de tus órdenes:

1. **Ver mapa:** Visualiza ubicaciones de entregas pendientes
2. **Asignar courier:** Selecciona un repartidor para cada entrega
3. **Seguimiento:** Monitorea el estado de las entregas en tiempo real

### 🔔 Notificaciones

En el header verás la campana de notificaciones:

- Badge rojo indica cantidad de no leídas
- Click para ver el centro de notificaciones
- Tipos: Orden recibida, Pago acreditado, Entrega completada

---

## Manual del Comprador (BUYER)

### 🏠 Dashboard (Inicio)

Pantalla inicial con accesos rápidos a comprar y ver pedidos.

### 🛒 Comprar (Marketplace)

**Ruta:** `/marketplace`

Busca y compra productos:

1. **Buscar:** Usa la barra de búsqueda (motor Meilisearch)
2. **Filtrar:** Por categoría, precio, disponibilidad
3. **Ver producto:** Click para ver detalles, descripción, vendedor
4. **Agregar al carrito:** Click en producto, aparece botón flotante con total
5. **Checkout:** Click en el carrito flotante (botón verde con total)

### 🛍️ Proceso de Compra

**Ruta:** `/buyer-checkout`

Flujo de 3 pasos:

1. **Paso 1 - Carrito:** Revisa tus productos, ajusta cantidades, elimina items
2. **Paso 2 - Dirección:** Selecciona o agrega dirección de envío
3. **Paso 3 - Confirmar:** Revisa resumen y confirma el pedido

Después de confirmar:

- Se crea la orden automáticamente
- Puedes ver el tracking inmediatamente
- El pedido aparece en "Mis Compras"

### 📋 Mis Compras

**Ruta:** `/orders`

Historial de tus pedidos:

1. **Ver estado:** Cada orden muestra su estado actual
2. **Tracking:** Click en "Ver Tracking" para seguir tu pedido en mapa
3. **Detalles:** Productos comprados, total, fecha

### 🔔 Notificaciones

Recibe alertas sobre:

- Orden confirmada
- Pedido en camino
- Pedido entregado

### 👤 Perfil

**Ruta:** `/profile`

Gestiona tu cuenta:

- **Información Personal:** Nombre y email
- **Mis Direcciones:** Guarda direcciones frecuentes (Casa, Trabajo, etc.)
  - Agregar nueva dirección con mapa
  - Establecer dirección predeterminada
  - Eliminar direcciones guardadas
- **Seguridad:** Cambiar contraseña

---

## Manual del Repartidor (COURIER)

### 🚚 Mis Entregas

**Ruta:** `/logistics`

Esta es tu pantalla principal. Aquí verás:

1. **Lista de trabajos:** Entregas asignadas a ti
2. **Mapa:** Visualiza las rutas con la ubicación del vendedor y comprador
3. **Detalles de entrega:**
   - Dirección de recogida (vendedor)
   - Dirección de entrega (comprador)
   - Productos a transportar

### 📍 Navegación

Para cada entrega puedes:

1. Ver la ruta óptima en el mapa (calculada por OSRM)
2. ETA estimado de llegada
3. Iniciar navegación

### ✅ Confirmar Entrega

Cuando completes una entrega:

1. Click en "Completar Entrega"
2. Toma foto del paquete entregado (Proof of Delivery)
3. Opcionalmente: obtener firma del cliente
4. Confirmar

### 🔔 Notificaciones

Alertas importantes:

- Nuevo trabajo asignado
- Cambios en la ruta
- Mensajes del vendedor/comprador

---

## Funcionalidades Comunes

### Cambiar Tema (Claro/Oscuro)

1. Click en tu avatar (esquina superior derecha)
2. Click en "Tema: Claro" o "Tema: Oscuro"
3. El cambio es instantáneo

### Cerrar Sesión

1. Click en tu avatar
2. Click en "Cerrar Sesión"
3. Confirma en el modal

### Centro de Notificaciones

1. Click en la campana 🔔 en el header
2. Ve todas tus notificaciones
3. "Marcar todas como leídas" o eliminar individualmente

### Tracking Público

Cualquier persona puede ver el estado de un pedido con el link:

```
https://puente.com/track/{trackingId}
```

---

## Solución de Problemas

### No puedo iniciar sesión

- Verifica tu email y contraseña
- Usa "¿Olvidaste tu contraseña?" para recuperar acceso

### No veo mis productos/órdenes

- Verifica tu conexión a internet
- Refresca la página (pull-to-refresh en móvil)
- Si el problema persiste, cierra sesión y vuelve a entrar

### El mapa no carga

- Permite permisos de ubicación en tu navegador
- Verifica que el servidor OSRM esté activo (solo desarrollo local)

---

_¿Necesitas ayuda adicional? Contacta a soporte@puente.com_
