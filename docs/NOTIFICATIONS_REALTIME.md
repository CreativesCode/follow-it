# Notificaciones de Pedidos Asignados (Gratis con Supabase Realtime)

## 🎯 Solución Implementada

Usamos **Supabase Realtime** (completamente gratis) para notificar a los mensajeros cuando se les asigna un nuevo pedido. Esta solución funciona mientras la app esté abierta y no requiere configuración adicional ni costos.

## ✅ Ventajas

- ✅ **100% Gratis** - No hay costos de FCM, APNS, o servicios externos
- ✅ **Tiempo Real** - Las notificaciones llegan instantáneamente
- ✅ **Sin Configuración** - Ya está todo listo, solo usar el hook
- ✅ **Funciona en Web y Móvil** - Mismo código para todas las plataformas

## 📱 Cómo Usar

### Opción 1: Usar el Provider (Recomendado)

Envuelve tu app del mensajero con el provider:

```tsx
// app/courier/layout.tsx o donde tengas la app del mensajero
import { CourierNotificationProvider } from "@/components/notifications/CourierNotificationProvider";

export default function CourierLayout({ children }) {
  const courierId = "tu-courier-id"; // Obtener del usuario autenticado

  return (
    <CourierNotificationProvider courierId={courierId}>
      {children}
    </CourierNotificationProvider>
  );
}
```

El provider automáticamente:

- Escucha cuando se asigna un pedido
- Muestra un toast/notificación visual
- Permite vibrar el dispositivo (si está disponible)
- Permite navegar al pedido con un clic

### Opción 2: Usar el Hook Directamente

Si prefieres más control:

```tsx
import { useCourierNotifications } from "@/lib/hooks/useCourierNotifications";

function CourierDashboard() {
  const courierId = "tu-courier-id";

  useCourierNotifications({
    courierId,
    onNewAssignment: (order) => {
      // Mostrar notificación personalizada
      alert(`¡Nuevo pedido! ${order.code || order.id}`);

      // O actualizar tu estado
      setNewOrders((prev) => [...prev, order]);
    },
  });

  return <div>...</div>;
}
```

## 🔔 Cómo Funciona

1. **Cuando se asigna un pedido:**

   - El backend actualiza la tabla `orders` con `assigned_courier_id`
   - Se crea un evento en `order_events` con tipo `order_assigned`

2. **El hook escucha:**

   - Cambios en `orders` donde `assigned_courier_id = courierId`
   - Nuevos eventos en `order_events` donde `courier_id = courierId`

3. **Cuando detecta una asignación:**
   - Llama a `onNewAssignment` con los datos del pedido
   - El componente muestra la notificación visual

## 🎨 Personalizar la Notificación

Puedes personalizar el componente `OrderAssignmentToast` o crear el tuyo:

```tsx
useCourierNotifications({
  courierId,
  onNewAssignment: (order) => {
    // Tu lógica personalizada
    showCustomNotification({
      title: "Nuevo pedido",
      message: `Pedido ${order.code}`,
      action: () => router.push(`/orders/${order.id}`),
    });
  },
});
```

## ⚠️ Limitaciones

- **Solo funciona con la app abierta**: Si el mensajero cierra la app, no recibirá notificaciones hasta que la abra de nuevo
- **No es push nativo**: No despierta el dispositivo ni muestra notificaciones del sistema operativo

## 🚀 Futuras Mejoras (Opcional)

Si en el futuro quieres notificaciones push nativas (que funcionan con la app cerrada):

1. **WhatsApp Business API** - ~$0.005-0.01 por mensaje
2. **SMS** - ~$0.01-0.05 por mensaje
3. **Push nativas (FCM/APNS)** - Gratis pero requiere configuración compleja

Por ahora, la solución con Realtime es perfecta para MVP y funciona muy bien si los mensajeros mantienen la app abierta.

## 📝 Ejemplo Completo

```tsx
// app/courier/page.tsx
"use client";

import { CourierNotificationProvider } from "@/components/notifications/CourierNotificationProvider";
import { useUser } from "@/lib/hooks/useUser";
import { useUserRole } from "@/lib/hooks/useUserRole";

export default function CourierPage() {
  const { user } = useUser();
  const { roleType, roleData } = useUserRole();

  // Obtener courier_id del usuario
  const courierId =
    roleType === "courier" ? (roleData as { id: string }).id : null;

  if (!courierId) {
    return <div>No eres un mensajero</div>;
  }

  return (
    <CourierNotificationProvider courierId={courierId}>
      <div>
        <h1>Panel del Mensajero</h1>
        {/* Tu contenido aquí */}
      </div>
    </CourierNotificationProvider>
  );
}
```
