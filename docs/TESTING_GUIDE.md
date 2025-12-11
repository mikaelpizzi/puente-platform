# 🧪 Guía de Testing - Puente Platform

> **Última actualización:** 2025-12-10  
> **Propósito:** Verificar que las funcionalidades están conectadas y funcionando

---

## 🌐 URLs de Desarrollo

| Servicio         | URL                   |
| ---------------- | --------------------- |
| Frontend PWA     | http://localhost:5173 |
| API Gateway      | http://localhost:3000 |
| MailHog (emails) | http://localhost:8025 |
| Meilisearch      | http://localhost:7700 |

---

## 👤 Usuarios de Prueba

| Rol     | Email                      | Password    |
| ------- | -------------------------- | ----------- |
| SELLER  | maria_vendedora@puente.com | password123 |
| BUYER   | carlos_cliente@puente.com  | password123 |
| COURIER | luis_repartidor@puente.com | password123 |

---

## ✅ Checklist de Verificación

### 1. Auth y Sesión

```
1. Abre http://localhost:5173
2. Verifica que redirige a /login
3. Ingresa credenciales de prueba
4. Verifica:
   ✓ Redirige a dashboard
   ✓ Campana 🔔 visible en header
   ✓ Avatar con inicial visible
   ✓ Navegación inferior aparece según rol
```

### 2. Dashboard por Rol

```
SELLER (maria_vendedora):
✓ Saludo: "Aquí tienes un resumen de tu negocio hoy"
✓ KPIs: Ventas Hoy y Productos
✓ Acciones: Inventario, Mis Ventas, Cobrar, Finanzas

BUYER (carlos_cliente):
✓ Saludo: "¿Qué quieres comprar hoy?"
✓ Sin KPIs
✓ Acciones: Explorar, Mis Compras

COURIER (luis_repartidor):
✓ Saludo: "Estas son tus entregas pendientes"
✓ Card de entregas pendientes (con gradient)
✓ Acciones: Mis Entregas, Mapa de Rutas
```

### 2.5 Breadcrumbs Navigation

```
1. Navega a cualquier página (ej: /inventory)
2. Verifica debajo del header:
   ✓ Muestra: 🏠 > Inventario (o la ruta actual)
   ✓ Click en 🏠 lleva a Inicio
   ✓ Texto de la página actual está en negrita
3. No aparece en la página de Inicio
```

### 3. Notificaciones (Campana)

```
1. Inicia sesión con cualquier usuario
2. Click en la campana 🔔 (header derecha)
3. Verifica:
   ✓ Abre panel de notificaciones
   ✓ Puede cerrar clickeando fuera
   ✓ "Marcar como leídas" funciona
```

### 4. Marketplace (BUYER)

```
1. Login como carlos_cliente@puente.com
2. Click "Explorar" o ir a /marketplace
3. Verifica:
   ✓ Barra de búsqueda funcional
   ✓ Botón de filtros (esquina superior derecha)
   ✓ Filtros de precio (min/max)
   ✓ Filtros por categorías/tags
   ✓ Productos con "Agregar al carrito"
   ✓ Carrito flotante aparece cuando hay items
4. Estado vacío: Si no hay productos muestra mensaje
5. Loading: Muestra skeleton animado al cargar
```

### 5. Inventario (SELLER)

```
1. Login como maria_vendedora@puente.com
2. Click "Inventario" o ir a /inventory
3. Verifica:
   ✓ Lista de productos existentes
   ✓ Botón "+ Nuevo Producto"
   ✓ Tabs: ACTIVOS / PAPELERA
   ✓ Botón de selección múltiple
   ✓ Gestor de Tags
4. Crear producto:
   - Click "+ Nuevo Producto"
   - Completar nombre, precio, SKU, stock
   - Subir imagen (arrastrar o click)
   - Agregar tags
   - Guardar
5. Ver detalle: Click en producto abre modal
```

### 6. Perfil y Direcciones

```
1. Click en avatar → "Mi Perfil"
2. Verifica secciones:
   ✓ Información Personal (nombre, email)
   ✓ Mis Direcciones (nuevo!)
   ✓ Seguridad (contraseña)
3. Click "+ Agregar nueva" en direcciones
4. Verifica formulario de dirección
```

### 4. Órdenes con Tracking

```
1. Inicia sesión como BUYER (carlos_cliente)
2. Ve a "Mis Compras"
3. Si hay órdenes en estado "shipped" o "processing":
   ✓ Botón "📍 Seguimiento" visible
   ✓ Click lleva a /track/:id
4. Si hay órdenes "delivered":
   ✓ Botón "⭐ Dejar reseña" visible (para BUYER)
```

### 5. Navegación por Rol

**SELLER (maria_vendedora):**

```
Navegación inferior debe mostrar:
✓ Inicio
✓ Inventario
✓ Mis Ventas
✓ Cobrar
✓ Finanzas
✓ Envíos
```

**BUYER (carlos_cliente):**

```
Navegación inferior debe mostrar:
✓ Inicio
✓ Comprar
✓ Mis Compras
```

**COURIER (luis_repartidor):**

```
Navegación inferior debe mostrar:
✓ Envíos
```

### 6. Tema Claro/Oscuro

```
1. Click en avatar
2. Click en "Tema: Claro" o "Tema: Oscuro"
3. Verifica:
   ✓ Cambio inmediato de colores
   ✓ Se mantiene al recargar
```

### 7. Responsive (Mobile/Desktop)

```
Para probar en Chrome DevTools (F12):
1. Click en el ícono de dispositivo (📱) o Ctrl+Shift+M
2. Selecciona "Responsive" o un dispositivo móvil

Verificar en MÓVIL (375px ancho):
✓ Navegación inferior visible y usable
✓ Productos en columna única
✓ Botones con tamaño táctil adecuado (mín 44px)
✓ Formularios ocupan ancho completo
✓ No hay scroll horizontal

Verificar en DESKTOP (1200px ancho):
✓ Productos en grid de 2-3 columnas
✓ Layouts aprovechan el espacio
✓ Hover effects funcionan
```

### 8. Sincronización Offline y Conflictos

```
1. Login como SELLER
2. Crea un producto mientras tienes conexión
3. Simula conflicto (requiere backend que soporte 409):
   - Edita el mismo producto desde dos sesiones
   - Al sincronizar debería aparecer:
     ✓ Modal amarillo "Conflicto detectado"
     ✓ Comparación lado a lado (Tu versión vs Servidor)
     ✓ Opciones: Usar tu versión, Usar servidor, Combinar
4. Selecciona resolución y confirma
```

---

## 🐛 Troubleshooting

### El frontend no carga

```bash
# Verificar que el dev server está corriendo
cd apps/frontend/pwa
pnpm run dev
```

### No veo la navegación

```
Posible causa: El usuario no tiene rol asignado
Solución: Cerrar sesión y volver a entrar
```

### Error 401 Unauthorized

```
Posible causa: Token expirado
Solución: Cerrar sesión y volver a entrar
```

### Error 403 Forbidden

```
Posible causa: Accediendo a ruta no permitida para tu rol
Ejemplo: SELLER no puede acceder a /marketplace
```

### Las direcciones no cargan

```
Posible causa: Backend no está corriendo
Solución:
1. Verificar que el backend esté activo
2. Verificar consola por errores de red
```

---

## 📝 Reportar Issues

Al encontrar un bug, documentar:

1. **URL** donde ocurrió
2. **Usuario** con el que estabas logueado
3. **Pasos** para reproducir
4. **Error** en consola (F12 → Console)
5. **Screenshot** si aplica

---

_Este documento se actualiza conforme se integran nuevas funcionalidades_
