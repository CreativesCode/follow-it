# 📍 Integración del Tracking GPS - Guía Completa

## 🎯 La Idea Principal

El sistema de tracking GPS permite:

1. **Mensajeros**: Envían su ubicación automáticamente cuando tienen pedidos activos
2. **Negocios**: Ven en tiempo real dónde están sus mensajeros en un mapa
3. **Clientes**: Pueden seguir su pedido en tiempo real (ya implementado en `/track/[token]`)

---

## 🔄 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE TRACKING GPS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │  APP MENSAJERO   │         │  PANEL NEGOCIO   │           │
│  │  (Capacitor)     │         │  (Web/Dashboard)  │           │
│  └────────┬─────────┘         └────────┬─────────┘           │
│           │                           │                       │
│           │ 1. Tiene pedidos activos? │                       │
│           │    (assigned/en_route)    │                       │
│           │                           │                       │
│           ▼                           │                       │
│  ┌──────────────────┐                 │                       │
│  │ useLocation      │                 │                       │
│  │ Tracking()       │                 │                       │
│  │                  │                 │                       │
│  │ • Detecta GPS    │                 │                       │
│  │ • Cada 30s o    │                 │                       │
│  │   50m de cambio │                 │                       │
│  └────────┬─────────┘                 │                       │
│           │                           │                       │
│           │ 2. POST /api/locations    │                       │
│           │    { lat, lng, ... }     │                       │
│           │                           │                       │
│           ▼                           │                       │
│  ┌──────────────────┐                 │                       │
│  │ API Route        │                 │                       │
│  │ /api/locations   │                 │                       │
│  │                  │                 │                       │
│  │ • Valida courier │                 │                       │
│  │ • Valida pedidos │                 │                       │
│  │ • Guarda en BD   │                 │                       │
│  └────────┬─────────┘                 │                       │
│           │                           │                       │
│           ▼                           │                       │
│  ┌──────────────────┐                 │                       │
│  │ Supabase         │                 │                       │
│  │ courier_locations│                 │                       │
│  │                  │                 │                       │
│  │ INSERT nuevo ping│                 │                       │
│  └────────┬─────────┘                 │                       │
│           │                           │                       │
│           │ 3. Realtime Broadcast     │                       │
│           │    (Supabase Realtime)    │                       │
│           │                           │                       │
│           │                           ▼                       │
│           │                  ┌──────────────────┐             │
│           │                  │ useRealtime     │             │
│           │                  │ Locations()     │             │
│           │                  │                  │             │
│           │                  │ • Suscripción   │             │
│           │                  │ • Actualiza UI   │             │
│           │                  │ • Mapa en tiempo │             │
│           │                  │   real           │             │
│           │                  └──────────────────┘             │
│           │                           │                       │
│           │                           ▼                       │
│           │                  ┌──────────────────┐             │
│           │                  │ Componente Mapa  │             │
│           │                  │ (Por implementar)│             │
│           │                  │                  │             │
│           │                  │ Muestra mensajeros│            │
│           │                  │ en tiempo real   │             │
│           │                  └──────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes Implementados

### 1. **Tipos TypeScript** (`types/location.ts`)

```typescript
// Tipos para el módulo de tracking
export type LocationPing = { ... }        // Ping individual
export type CourierWithLocation = { ... }  // Mensajero con ubicación
// CourierLocation ya está en database.ts
```

### 2. **Validaciones Zod** (`lib/validations/location.ts`)

```typescript
locationPingSchema; // Valida un ping individual
locationBatchSchema; // Valida batch de pings (para offline)
```

### 3. **API Route** (`app/api/locations/route.ts`)

- **POST** `/api/locations`
- Valida que el usuario es mensajero activo
- Valida que tiene pedidos activos
- Guarda ping en `courier_locations`
- Soporta ping individual o batch (para sincronización offline)

### 4. **Hook: useLocationTracking** (`lib/hooks/useLocationTracking.ts`)

**Para: Mensajeros (app móvil)**

```typescript
const { isTracking, lastLocation, error, offlineQueueSize } =
  useLocationTracking(hasActiveOrders);
```

**Características:**

- ✅ Se activa automáticamente cuando `hasActiveOrders = true`
- ✅ Usa Capacitor Geolocation en mobile, fallback a Web API
- ✅ Envía ping solo si:
  - Pasaron 30 segundos desde el último, O
  - Se movió más de 50 metros
- ✅ Cola offline (máx 50 pings)
- ✅ Sincronización automática al volver online

### 5. **Hook: useRealtimeLocations** (`lib/hooks/useRealtimeLocations.ts`)

**Para: Panel de negocio (dashboard)**

```typescript
const { couriers, loading, error } = useRealtimeLocations(businessId);
```

**Características:**

- ✅ Obtiene mensajeros activos con última ubicación
- ✅ Suscripción realtime a `courier_locations`
- ✅ Actualiza automáticamente cuando llega nuevo ping
- ✅ Incluye conteo de pedidos activos por mensajero

---

## 🔌 Cómo Integrarlo

### **En la App del Mensajero**

```typescript
// app/dashboard/page.tsx (para mensajeros)
"use client";

import { useLocationTracking } from "@/lib/hooks/useLocationTracking";
import { useOrders } from "@/lib/hooks/useOrders";

export default function CourierDashboard() {
  // Obtener pedidos activos
  const { orders } = useOrders({
    status: "assigned", // o "en_route"
  });

  const hasActiveOrders = orders.length > 0;

  // Hook de tracking (se activa automáticamente)
  const { isTracking, lastLocation, error, offlineQueueSize } =
    useLocationTracking(hasActiveOrders);

  return (
    <div>
      {/* Indicador de tracking */}
      {isTracking && (
        <div className="bg-green-100 p-2">
          📍 Tracking activo
          {lastLocation && (
            <p>
              Última ubicación: {lastLocation.lat}, {lastLocation.lng}
            </p>
          )}
        </div>
      )}

      {error && <div className="text-red-500">{error}</div>}

      {offlineQueueSize > 0 && (
        <div className="bg-yellow-100 p-2">
          ⚠️ {offlineQueueSize} ubicaciones pendientes de enviar
        </div>
      )}

      {/* Lista de pedidos... */}
    </div>
  );
}
```

### **En el Panel del Negocio**

```typescript
// app/dashboard/couriers/page.tsx o nuevo componente de mapa
"use client";

import { useRealtimeLocations } from "@/lib/hooks/useRealtimeLocations";

export function CouriersMap({ businessId }: { businessId: string }) {
  const { couriers, loading, error } = useRealtimeLocations(businessId);

  if (loading) return <div>Cargando mensajeros...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Mensajeros en Tiempo Real</h2>

      {/* Aquí iría un componente de mapa (Google Maps, Mapbox, etc.) */}
      <div className="h-96 bg-gray-200 rounded">
        {couriers.map((courier) => {
          if (!courier.last_location) return null;

          return (
            <div key={courier.id}>
              <strong>{courier.display_name}</strong>
              <p>
                📍 {courier.last_location.lat.toFixed(6)},
                {courier.last_location.lng.toFixed(6)}
              </p>
              <p>Pedidos activos: {courier.active_orders_count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🎨 Próximos Pasos (Opcional)

### 1. **Componente de Mapa**

Crear `components/map/CouriersMap.tsx` con:

- Google Maps o Mapbox
- Marcadores para cada mensajero
- Actualización en tiempo real
- Líneas de ruta (opcional)

### 2. **Indicador Visual en App Mensajero**

- Badge de "Tracking activo"
- Indicador de batería/GPS
- Contador de pings enviados

### 3. **Historial de Rutas**

- Mostrar ruta completa del día
- Timeline de ubicaciones
- Distancia total recorrida

---

## ⚙️ Configuración y Optimización

### **Ajustar Intervalos** (si es necesario)

```typescript
useLocationTracking(hasActiveOrders, {
  intervalMs: 60000, // 1 minuto (más batería)
  minDistanceM: 100, // 100 metros (menos pings)
  maxQueueSize: 100, // Más pings offline
});
```

### **Permisos en Capacitor**

Ya están configurados en:

- `android/app/src/main/AndroidManifest.xml`
- `ios/App/App/Info.plist`

---

## 📊 Flujo de Datos

1. **Mensajero abre app** → Hook detecta pedidos activos
2. **Hook inicia tracking** → GPS comienza a enviar ubicación
3. **Cada 30s o 50m** → Ping enviado a `/api/locations`
4. **API valida y guarda** → INSERT en `courier_locations`
5. **Supabase Realtime** → Broadcast a suscriptores
6. **Panel recibe update** → Hook actualiza estado
7. **UI se re-renderiza** → Mapa muestra nueva posición

---

## ✅ Estado Actual

- ✅ Tipos TypeScript
- ✅ Validaciones Zod
- ✅ API Route
- ✅ Hook useLocationTracking (con Capacitor)
- ✅ Hook useRealtimeLocations
- ⏳ Componente de mapa (pendiente)
- ⏳ Integración en UI (pendiente)

---

## 🚀 Para Usar Ahora

1. **En app mensajero**: Agregar `useLocationTracking(hasActiveOrders)`
2. **En dashboard**: Agregar `useRealtimeLocations(businessId)`
3. **Opcional**: Crear componente de mapa para visualizar

¡El sistema está listo para usar! 🎉
