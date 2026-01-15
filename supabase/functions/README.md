# Edge Functions - Follow It

Este directorio contiene las Edge Functions de Supabase para el sistema de gestión de repartos.

## 📋 Funciones Disponibles

### 1. `change_order_status`

Cambia el estado de un pedido con validación de transiciones y permisos.

**Endpoint:** `POST /functions/v1/change_order_status`

**Payload:**

```json
{
  "order_id": "uuid",
  "to_status": "pending" | "assigned" | "en_route" | "delivered" | "failed" | "canceled",
  "note": "string (opcional, requerido para failed)",
  "proof_id": "uuid (opcional)"
}
```

**Respuesta:**

```json
{
  "order_id": "uuid",
  "from_status": "pending",
  "to_status": "assigned",
  "courier_id": "uuid | null"
}
```

### 2. `assign_order`

Asigna un pedido a un mensajero.

**Endpoint:** `POST /functions/v1/assign_order`

**Payload:**

```json
{
  "order_id": "uuid",
  "courier_id": "uuid"
}
```

**Respuesta:**

```json
{
  "order_id": "uuid",
  "courier_id": "uuid",
  "status": "assigned"
}
```

### 3. `get_tracking_snapshot`

Obtiene información de tracking público para un cliente (sin autenticación).

**Endpoint:** `GET /functions/v1/get_tracking_snapshot?token=<token>`

**Respuesta:**

```json
{
  "order": {
    "id": "uuid",
    "status": "en_route",
    "code": "#A1023",
    "dropoff_address": "Calle 123",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "courier": {
    "lat": 23.123,
    "lng": -82.456,
    "recorded_at": "2024-01-01T12:00:00Z",
    "accuracy_m": 10.5
  }
}
```

### 4. `create_tracking_link`

Crea un link de tracking público para un pedido.

**Endpoint:** `POST /functions/v1/create_tracking_link`

**Payload:**

```json
{
  "order_id": "uuid",
  "expires_in_minutes": 1440 // opcional, default 24 horas
}
```

**Respuesta:**

```json
{
  "tracking_link_id": "uuid",
  "token": "token-único-solo-una-vez",
  "expires_at": "2024-01-02T12:00:00Z",
  "tracking_url": "https://..."
}
```

### 5. `create_proof_upload`

Genera una URL firmada para subir un comprobante (foto/firma).

### 6. `send_push_notification`

Envía notificaciones push a los dispositivos de un usuario.

**Endpoint:** `POST /functions/v1/send_push_notification`

**Autenticación:** Requiere `SUPABASE_SERVICE_ROLE_KEY` en el header `Authorization: Bearer <service_role_key>`

**Payload:**

```json
{
  "user_id": "uuid",
  "title": "string",
  "body": "string",
  "data": {
    "type": "order_assigned",
    "order_id": "uuid",
    "courier_id": "uuid"
  }
}
```

**Respuesta:**

```json
{
  "sent": true,
  "tokens_checked": 2,
  "results": {
    "ios": { "sent": 1, "failed": 0 },
    "android": { "sent": 1, "failed": 0 },
    "web": { "sent": 0, "failed": 0 }
  },
  "message": "Notification queued for delivery"
}
```

**Nota:** Esta función actualmente prepara la estructura para FCM (Android) y APNS (iOS), pero requiere configuración adicional de credenciales para funcionar completamente.

**Endpoint:** `POST /functions/v1/create_proof_upload`

**Payload:**

```json
{
  "order_id": "uuid",
  "proof_type": "photo" | "signature"
}
```

**Respuesta:**

```json
{
  "order_id": "uuid",
  "proof_type": "photo",
  "storage_path": "proofs/.../file.jpg",
  "upload_url": "https://...",
  "token": "...",
  "path": "..."
}
```

## 🚀 Desplegar Funciones

### Opción 1: Desplegar todas las funciones

```bash
# Desplegar todas las funciones de una vez
npx supabase functions deploy change_order_status
npx supabase functions deploy get_tracking_snapshot
npx supabase functions deploy assign_order
npx supabase functions deploy create_tracking_link
npx supabase functions deploy create_proof_upload
```

### Opción 2: Desplegar función específica

```bash
npx supabase functions deploy <nombre_funcion>
```

### Opción 3: Desplegar con variables de entorno

Las funciones usan automáticamente las variables de entorno de Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Estas se configuran automáticamente cuando despliegas desde Supabase CLI.

## 🔧 Desarrollo Local

### Iniciar Supabase localmente

```bash
# Iniciar Supabase local (requiere Docker)
npx supabase start

# Las funciones estarán disponibles en:
# http://localhost:54321/functions/v1/<nombre_funcion>
```

### Probar funciones localmente

```bash
# Ejemplo: probar change_order_status
curl -X POST http://localhost:54321/functions/v1/change_order_status \
  -H "Authorization: Bearer <tu-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "...", "to_status": "assigned"}'
```

## 📁 Estructura

```
supabase/functions/
├── _shared/              # Código compartido
│   ├── supabase.ts      # Clientes de Supabase
│   ├── http.ts          # Helpers HTTP
│   └── crypto.ts        # Utilidades crypto
├── change_order_status/
│   └── index.ts
├── get_tracking_snapshot/
│   └── index.ts
├── assign_order/
│   └── index.ts
├── create_tracking_link/
│   └── index.ts
└── create_proof_upload/
    └── index.ts
```

## 🔐 Seguridad

- Todas las funciones (excepto `get_tracking_snapshot`) requieren autenticación JWT
- `get_tracking_snapshot` usa tokens hash para validación
- Las funciones usan `service_role` para operaciones administrativas
- RLS está habilitado en todas las tablas

## 📝 Notas

- Las funciones usan **Deno** runtime (no Node.js)
- Los imports usan `jsr:` para paquetes de JSR
- Las rutas de importación son relativas: `../_shared/...`
- Los tokens de tracking se devuelven **solo una vez** por seguridad

## 🐛 Troubleshooting

### Error: "Entrypoint path does not exist"

- Verifica que el archivo `index.ts` existe en la carpeta de la función
- Asegúrate de estar en el directorio raíz del proyecto

### Error: "Docker is not running"

- Solo necesario para desarrollo local
- Para producción, usa `npx supabase functions deploy` directamente

### Error de importación

- Verifica que los archivos en `_shared/` existen
- Las rutas deben ser relativas: `../_shared/supabase.ts`
