Sí, es totalmente viable y el stack **Next.js (SPA) + Capacitor + Supabase** encaja muy bien para esto, sobre todo si quieres iterar rápido y tener una app móvil “real” (GPS/cámara/push) sin mantener 2 codebases.

## Encaje producto–mercado

La propuesta es fuerte porque resuelve 3 dolores reales y repetitivos:

1. **Asignación y control** (quién lleva qué, en qué estado está)
2. **Evidencia de entrega** (foto/firma simple)
3. **Visibilidad en tiempo real** (para negocio y opcionalmente cliente)

Los nichos que mencionas (comida, agua, gas, combos, mensajería local) son perfectos porque tienen volumen, urgencia y fricción operativa diaria.

## Stack: por qué tiene sentido

### Next.js + Capacitor (SPA)

- Un solo frontend para **web admin** + **app repartidor** (mismos componentes/lógica, UI por rol).
- Capacitor te da lo clave: **geolocalización**, **cámara**, **notificaciones push**, almacenamiento local.
- Para tracking, el punto crítico es **background location**:

  - En Android es factible con “foreground service”.
  - En iOS es posible, pero hay que hacerlo bien (permisos, modos de ubicación, consumo).
  - Capacitor puede, pero probablemente necesitarás un plugin de background geolocation (y cuidar batería/políticas).

### Supabase (backend)

- Auth + RLS + Postgres + Storage + Realtime = ideal.
- **Realtime** para ver mensajeros moviéndose, cambios de estado, asignaciones.
- **Storage** para foto de entrega y/o firma.
- **Edge Functions** para lógica “server-side” (p.ej. validar transición de estado, generar links de tracking, webhooks, etc).

## Qué haría para que sea “vendible”

### MVP realista (2–4 semanas bien enfocado)

- Negocio:

  - Crear pedidos (manual o import básico).
  - Asignar pedidos a mensajero.
  - Ver tablero: **Pendiente / Asignado / En camino / Entregado / Fallido**.
  - Ver ruta del día (lista + mapa básico).

- Mensajero (app):

  - Lista de pedidos asignados.
  - Cambiar estado (en camino/entregado/fallido).
  - **Comprobante simple**: foto + nota (y opcional firma).

- Tracking:

  - Ubicación del mensajero “en vivo” (cada X segundos / al moverse X metros).
  - Historial simple de posiciones por entrega o por turno.

### Diferenciadores que suben el valor

- Link de tracking para cliente (sin login) con expiración.
- “Prueba de entrega” con foto + geo + hora.
- Zonas y “rutas” sugeridas (luego optimización).

## Puntos delicados (para decidir bien desde el inicio)

1. **Tracking continuo vs por eventos**

   - Si haces tracking cada 5–10s 8h/día: sube consumo + costos + complejidad.
   - Alternativa MVP: tracking por “pings” cada 30–60s y solo cuando hay entregas activas, o por distancia recorrida.

2. **Offline**

   - En Cuba/LatAm puede haber ratos sin datos.
   - Necesitas cola local: cambios de estado + foto se guardan y sincronizan cuando vuelve conexión.

3. **Mapas**

   - Google Maps puede ser caro a escala; OSM/Mapbox son opciones.
   - MVP: mapa básico con un proveedor + lista por defecto.

4. **Seguridad multi-tenant (RLS)**

   - Supabase lo resuelve, pero hay que diseñar bien el esquema: empresa → usuarios → repartidores → pedidos.

## Modelo de cobro

Ambos modelos funcionan, pero yo lo empaquetaría así:

- **Plan por negocio/mes** con límite de mensajeros activos + entregas/mes.
- Upsell: **mensajero activo adicional** o “paquetes de entregas”.
  Ejemplo simple:
- Starter: 1 negocio, 2 mensajeros, 1,000 entregas/mes
- Pro: 1 negocio, 10 mensajeros, 10,000 entregas/mes
- Enterprise: multi-sucursales + integraciones

## Recomendación técnica concreta

- Frontend: Next.js (App Router) como SPA, dos “apps” por rol en el mismo proyecto.
- Mobile: Capacitor + plugins:

  - Geolocation + (si hace falta) Background Geolocation
  - Camera
  - Push Notifications

- Backend: Supabase

  - Tablas: businesses, users, couriers, orders, order_events, courier_locations, proofs
  - Storage bucket: proofs (fotos/firmas)
  - Realtime: orders + courier_locations
  - Edge Functions: creación de tracking link, validación de estados, webhooks

Aquí tienes **todas las especificaciones** (producto + técnico) y un paquete completo listo para arrancar en **Supabase**: **esquema de BD (SQL)**, **políticas RLS**, y **flujo de eventos end-to-end**.

---

## 0) Sistema de Autenticación (IMPLEMENTADO)

### Stack Técnico de Autenticación

El sistema de autenticación está completamente implementado usando **Supabase Auth** con las siguientes características:

#### Métodos de Autenticación Disponibles

1. **Email/Password** ✅

   - Registro con validación de contraseña segura
   - Login con credenciales
   - Verificación de email obligatoria (configurable)
   - Recuperación de contraseña
   - Cambio de contraseña

2. **Magic Links** ✅

   - Inicio de sesión sin contraseña
   - Envío de enlace mágico por email
   - Ideal para usuarios móviles

3. **OAuth Providers** (preparado)
   - Google OAuth
   - GitHub OAuth
   - Fácilmente extensible a otros providers

#### Estructura de Archivos de Autenticación

```
lib/
  auth/
    actions.ts          # Server Actions para login, registro, logout, etc.
  hooks/
    useUser.ts          # Hook para obtener usuario actual
    useUserRole.ts      # Hook para obtener rol del usuario
  utils/
    auth.ts             # Utilidades server-side para protección de rutas
  supabase/
    client.ts           # Cliente Supabase para componentes cliente
    server.ts           # Cliente Supabase para Server Components
    middleware.ts       # Middleware con protección de rutas

app/
  auth/
    login/              # Página de inicio de sesión
    register/           # Página de registro
    forgot-password/    # Recuperación de contraseña
    reset-password/     # Restablecer contraseña
    verify-email/       # Verificación de email
    callback/           # Callback OAuth y Magic Links
    onboarding/         # Configuración inicial post-registro

components/
  ui/
    FormInput.tsx       # Input reutilizable con validación
    Button.tsx          # Botón con estados de carga
    AuthCard.tsx        # Card container para páginas auth
    Alert.tsx           # Componente de alertas
    Divider.tsx         # Divisor con texto
```

#### Server Actions Implementadas

Todas las server actions están en `lib/auth/actions.ts`:

- `login(formData)` - Iniciar sesión con email/password
- `register(formData)` - Crear cuenta nueva
- `logout()` - Cerrar sesión
- `forgotPassword(formData)` - Enviar email de recuperación
- `resetPassword(formData)` - Actualizar contraseña
- `sendMagicLink(formData)` - Enviar enlace mágico
- `resendVerificationEmail()` - Reenviar email de verificación
- `signInWithOAuth(provider)` - Iniciar sesión con OAuth

#### Middleware de Protección de Rutas

El middleware (`middleware.ts`) implementa:

- **Rutas públicas**: `/`, `/auth/*`, `/terms`, `/privacy`
- **Redirección automática**: usuarios autenticados no pueden acceder a páginas de auth
- **Protección de rutas**: usuarios no autenticados son redirigidos a `/auth/login`
- **Preservación de destino**: redirecciona al destino original post-login

#### Hooks y Utilidades

**Client-side hooks** (`lib/hooks/`):

```typescript
// Obtener usuario actual con reactivity
const { user, loading } = useUser();

// Obtener rol del usuario (business/courier)
const { type, businessMember, courier, loading } = useUserRole();
```

**Server-side utilities** (`lib/utils/auth.ts`):

```typescript
// Requiere autenticación (redirige si no autenticado)
const user = await requireAuth();

// Obtener rol del usuario
const role = await getUserRole(userId);

// Requiere rol de negocio
const { user, businessMember } = await requireBusinessRole();

// Requiere rol de mensajero
const { user, courier } = await requireCourierRole();
```

#### Flujo de Onboarding

Después del registro, el usuario pasa por un flujo de onboarding:

1. **Selección de Rol**:

   - Negocio: crea un negocio y se convierte en owner
   - Mensajero: debe ser invitado por un negocio

2. **Configuración Inicial**:

   - Negocio: nombre del negocio, zona horaria
   - Mensajero: espera invitación

3. **Redirección al Dashboard**:
   - Una vez configurado, accede al dashboard correspondiente

#### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Opcional: URL del sitio (para callbacks)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Validación y Seguridad

- **Validación con Zod**: Todas las entradas se validan con schemas Zod
- **Contraseñas seguras**: Mínimo 8 caracteres, mayúscula, minúscula y número
- **CSRF Protection**: Next.js Server Actions incluyen protección CSRF
- **RLS (Row Level Security)**: Supabase RLS protege datos a nivel de BD
- **Session Management**: Sesiones HTTP-only cookies (no localStorage)
- **HTTPS obligatorio**: En producción (manejo automático en Vercel/Supabase)

#### Configuración de Supabase Auth

En el dashboard de Supabase, configurar:

1. **Email Templates** personalizados (opcional)
2. **OAuth Providers** si usas Google/GitHub
3. **Site URL**: tu dominio de producción
4. **Redirect URLs**: `https://yourdomain.com/auth/callback`
5. **Email Verification**: activar/desactivar según necesites

#### Compatibilidad con Capacitor

El sistema de autenticación es **100% compatible con Capacitor**:

- ✅ Usa cookies HTTP-only (no localStorage)
- ✅ Deep links configurables para OAuth
- ✅ Funciona offline (con cola de sincronización)
- ✅ Biometría (próximamente con Capacitor plugins)

#### Próximos Pasos de Autenticación

- [ ] Implementar autenticación biométrica (Face ID/Touch ID)
- [ ] Añadir MFA (Multi-Factor Authentication)
- [ ] Sesiones de dispositivo múltiple
- [ ] Registro con número de teléfono (SMS OTP)
- [ ] Social login adicional (Apple, Facebook)

#### Prueba del Sistema

Para probar el sistema de autenticación:

1. Inicia el servidor: `npm run dev`
2. Ve a `http://localhost:3000`
3. Haz clic en "Comenzar Gratis" o "Iniciar Sesión"
4. Regístrate con un email (si email verification está desactivado, accederás inmediatamente)
5. Completa el onboarding
6. Accede al dashboard

**Nota**: En desarrollo local, la verificación de email puede estar desactivada. Verifica la configuración en Supabase Dashboard > Authentication > Settings > Email.

---

## 0.1) Sistema de Invitaciones de Mensajeros (IMPLEMENTADO)

### Descripción General

El sistema permite a los negocios invitar mensajeros mediante códigos únicos de invitación. Los mensajeros pueden unirse a un negocio ingresando el código durante el proceso de onboarding.

### Características Implementadas

#### 1. Generación de Códigos de Invitación ✅

- Los negocios pueden generar códigos únicos de 8 caracteres (alfanuméricos)
- Cada código tiene una expiración de 7 días por defecto
- Los códigos son únicos y no se pueden duplicar
- Función SQL: `generate_invitation_code()`

#### 2. Creación de Invitaciones ✅

- Los miembros del negocio pueden crear invitaciones desde el dashboard
- Opcionalmente pueden especificar nombre y email del mensajero
- Las invitaciones se almacenan con estado `pending`
- Endpoint: `POST /api/couriers/invite`

**Parámetros:**

```json
{
  "businessId": "uuid",
  "courierEmail": "email@example.com", // opcional
  "courierName": "Nombre Mensajero" // opcional
}
```

#### 3. Validación de Códigos ✅

- Los mensajeros pueden validar códigos antes de aceptarlos
- Verifica que el código sea válido, esté pendiente y no haya expirado
- Muestra información del negocio al que se están uniendo
- Endpoint: `POST /api/couriers/validate`

**Parámetros:**

```json
{
  "invitationCode": "ABC12345"
}
```

**Respuesta:**

```json
{
  "valid": true,
  "invitation": {
    "id": "uuid",
    "business_id": "uuid",
    "invitation_code": "ABC12345",
    "courier_name": "Nombre Mensajero",
    "courier_email": "email@example.com",
    "expires_at": "2024-01-15T00:00:00Z",
    "businesses": {
      "id": "uuid",
      "name": "Nombre del Negocio"
    }
  }
}
```

#### 4. Aceptación de Invitaciones ✅

- Los mensajeros pueden aceptar invitaciones durante el onboarding
- Crea automáticamente el registro de mensajero en la base de datos
- Marca la invitación como `accepted`
- Previene duplicados (no permite ser mensajero dos veces del mismo negocio)
- Endpoint: `POST /api/couriers/accept`

**Parámetros:**

```json
{
  "invitationCode": "ABC12345"
}
```

**Función SQL:** `accept_courier_invitation(p_invitation_code, p_user_id)`

#### 5. Gestión de Invitaciones en el Dashboard ✅

- Los negocios pueden ver todas sus invitaciones creadas
- Visualización de estado: `pending`, `accepted`, `expired`, `cancelled`
- Filtrado y búsqueda de invitaciones
- Página: `/dashboard/couriers`

### Flujo Completo de Invitación

#### Para el Negocio:

1. **Crear Invitación:**

   - Ir a `/dashboard/couriers`
   - Hacer clic en "Invitar Mensajero"
   - Opcionalmente ingresar nombre y email del mensajero
   - Generar código de invitación
   - Compartir el código con el mensajero

2. **Gestionar Invitaciones:**
   - Ver lista de invitaciones creadas
   - Ver estado de cada invitación
   - Ver mensajeros que han aceptado

#### Para el Mensajero:

1. **Registrarse:**

   - Ir a `/auth/register`
   - Crear cuenta con email y contraseña
   - Verificar email (si está habilitado)

2. **Onboarding:**
   - Seleccionar rol "Mensajero"
   - Ingresar código de invitación recibido
   - Validar código (ver información del negocio)
   - Aceptar invitación
   - Redirección automática al dashboard

### Estructura de Base de Datos

**Tabla: `courier_invitations`**

```sql
create table public.courier_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  invitation_code text not null unique,
  courier_email text,
  courier_name text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Políticas RLS (Row Level Security)

- **Negocios:** Pueden ver y crear invitaciones para su negocio
- **Mensajeros:** Pueden validar cualquier invitación por código (autenticados)
- **Público:** No tiene acceso

### Funciones SQL Implementadas

#### `generate_invitation_code()`

Genera un código único de 8 caracteres alfanuméricos en mayúsculas.

#### `accept_courier_invitation(p_invitation_code text, p_user_id uuid)`

- Valida que el código sea válido y no haya expirado
- Previene duplicados (no permite ser mensajero dos veces)
- Crea el registro en `couriers` con los datos de la invitación
- Marca la invitación como `accepted`
- Retorna el `courier_id` creado

### Endpoints API Implementados

| Método | Endpoint                 | Descripción                     | Autenticación         |
| ------ | ------------------------ | ------------------------------- | --------------------- |
| POST   | `/api/couriers/invite`   | Crear nueva invitación          | Requerida (negocio)   |
| POST   | `/api/couriers/validate` | Validar código de invitación    | Requerida             |
| POST   | `/api/couriers/accept`   | Aceptar invitación              | Requerida (mensajero) |
| GET    | `/api/couriers/invite`   | Listar invitaciones del negocio | Requerida (negocio)   |

### Páginas UI Implementadas

- **`/dashboard/couriers`** - Gestión de mensajeros e invitaciones (solo negocios)
- **`/auth/onboarding`** - Flujo de onboarding con validación de código (mensajeros)

### Seguridad

- ✅ Códigos únicos generados criptográficamente
- ✅ Expiración automática de invitaciones (7 días)
- ✅ Validación de permisos (solo miembros del negocio pueden crear invitaciones)
- ✅ Prevención de duplicados (no permite ser mensajero dos veces)
- ✅ RLS protege acceso a invitaciones
- ✅ Validación de estado y expiración antes de aceptar

### Próximas Mejoras

- [ ] Envío automático de emails con códigos de invitación
- [ ] Notificaciones push cuando se acepta una invitación
- [ ] Cancelación de invitaciones pendientes
- [ ] Extensión de fecha de expiración
- [ ] Límite de invitaciones por negocio
- [ ] Historial completo de invitaciones aceptadas

---

## 1) Especificaciones del sistema “Gestión de repartos”

### Roles

- **Admin/Operador (Negocio)**: crea pedidos, asigna a mensajeros, monitorea estados y mapa, revisa comprobantes.
- **Mensajero**: ve pedidos asignados, cambia estados, sube comprobante (foto/firma simple), envía ubicación.
- **Cliente (opcional)**: solo ve tracking por link (sin login).

### Estados del pedido (MVP)

- `pending` (creado, sin asignar)
- `assigned` (asignado a mensajero)
- `en_route` (en camino)
- `delivered` (entregado)
- `failed` (fallido)
- `canceled` (cancelado)

> Recomendación: **los estados se cambian siempre creando un evento** (event-sourcing ligero). El estado actual del pedido se guarda en `orders.status`, pero la verdad es `order_events`.

### Comprobante (proof of delivery)

- Mínimo viable: **foto** + nota.
- Opcional: firma simple (captura canvas) como imagen adicional.
- Se guarda en Supabase Storage y se registra metadata en BD:

  - `proof_type`: `photo` | `signature`
  - `storage_path`
  - `captured_at`, `lat`, `lng`

### Tracking (ubicación)

- App mensajero manda “pings”:

  - cada **30–60s** y/o cada **50–100m**
  - solo cuando tenga pedidos activos (assigned/en_route)

- Guardamos en `courier_locations` y emitimos realtime para el panel.

### Offline

- La app debe tener cola local para:

  - cambios de estado
  - uploads de proof (se puede guardar localmente y reintentar)
  - pings de ubicación (se pueden agrupar o descartar si son muy viejos)

### Modelo de cobro (como lo hablamos)

- Por **negocio/mes** con límites (mensajeros activos + entregas/mes), y/o
- Por **mensajero activo** adicional.

---

## 2) Arquitectura propuesta (Next SPA + Capacitor + Supabase)

### Frontend

- **Next.js (SPA)**:

  - “Panel Negocio”
  - “App Mensajero” (misma codebase, UI por rol)

- **Capacitor**:

  - Geolocalización + (si se requiere) background tracking
  - Cámara
  - Push notifications (asignación / cambios)

### Backend (Supabase)

- Auth (supabase auth)
- Postgres + RLS multi-tenant
- Storage para proofs
- Realtime para:

  - `orders` (cambios)
  - `order_events` (timeline)
  - `courier_locations` (mapa)

- Edge Functions (recomendado para flujos críticos):

  - transición de estados (validación)
  - creación de links de tracking
  - ingest de ubicación si quieres controlar frecuencia/abuso

> Nota importante: **tracking público (cliente sin login)** conviene hacerlo vía **Edge Function** (service role) validando token, en vez de intentar RLS “public”.

---

## 3) Esquema de base de datos (SQL listo para Supabase)

> Usa `uuid` por defecto. En Supabase normalmente `extensions` ya están, pero lo dejo explícito.

```sql
-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.order_status as enum ('pending','assigned','en_route','delivered','failed','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_event_type as enum (
    'order_created',
    'order_assigned',
    'order_unassigned',
    'courier_accepted',
    'status_changed',
    'proof_uploaded',
    'note_added',
    'order_canceled',
    'order_failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_type as enum ('photo','signature');
exception when duplicate_object then null; end $$;

-- 1) Businesses (tenants)
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Havana',
  created_at timestamptz not null default now()
);

-- 2) Membership + roles (admin/operator within a business)
create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- 3) Couriers (linked to auth user)
create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- 4) Customers (optional, for nicer order records)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

-- 5) Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,

  code text, -- opcional: visible code like #A1023
  customer_id uuid references public.customers(id) on delete set null,

  pickup_address text,
  dropoff_address text not null,
  dropoff_lat double precision,
  dropoff_lng double precision,

  notes text,
  items_summary text, -- "2x combo, 1x agua 10L" (MVP)
  amount_cents integer,
  currency text default 'USD',

  status public.order_status not null default 'pending',

  -- current assignment (optional to denormalize)
  assigned_courier_id uuid references public.couriers(id) on delete set null,
  assigned_at timestamptz,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_business_status on public.orders (business_id, status);
create index if not exists idx_orders_assigned_courier on public.orders (assigned_courier_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- 6) Order Events (timeline + source of truth)
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,

  type public.order_event_type not null,
  from_status public.order_status,
  to_status public.order_status,

  courier_id uuid references public.couriers(id) on delete set null,

  note text,
  meta jsonb not null default '{}'::jsonb,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order on public.order_events (order_id, created_at desc);

-- 7) Proofs (photo/signature)
create table if not exists public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,

  type public.proof_type not null,
  storage_path text not null, -- e.g. proofs/<business>/<order>/<uuid>.jpg
  captured_at timestamptz not null default now(),

  lat double precision,
  lng double precision,

  created_at timestamptz not null default now()
);

create index if not exists idx_order_proofs_order on public.order_proofs (order_id, created_at desc);

-- 8) Courier Locations (tracking pings)
create table if not exists public.courier_locations (
  id bigserial primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  courier_id uuid not null references public.couriers(id) on delete cascade,

  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  speed_mps double precision,
  heading double precision,

  recorded_at timestamptz not null default now()
);

create index if not exists idx_courier_locations_courier_time on public.courier_locations (courier_id, recorded_at desc);

-- 9) Tracking links (for clients)
create table if not exists public.order_tracking_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,

  token_hash text not null, -- store hash, not raw token
  expires_at timestamptz not null,
  is_revoked boolean not null default false,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (order_id, token_hash)
);

create index if not exists idx_tracking_links_order on public.order_tracking_links (order_id);
```

---

## 4) Políticas RLS (multi-tenant + roles)

### Helper functions (para simplificar policies)

```sql
-- Enable RLS
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.couriers enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.order_proofs enable row level security;
alter table public.courier_locations enable row level security;
alter table public.order_tracking_links enable row level security;

-- Is member of business?
create or replace function public.is_business_member(bid uuid, uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.business_members bm
    where bm.business_id = bid and bm.user_id = uid and bm.is_active = true
  );
$$;

-- Get courier_id for user in business (if any)
create or replace function public.get_courier_id(bid uuid, uid uuid)
returns uuid language sql stable as $$
  select c.id
  from public.couriers c
  where c.business_id = bid and c.user_id = uid and c.is_active = true
  limit 1;
$$;
```

### Policies por tabla

#### `businesses`

- Solo miembros pueden leer su business.

```sql
drop policy if exists "businesses_select_member" on public.businesses;
create policy "businesses_select_member"
on public.businesses for select
using (public.is_business_member(id, auth.uid()));
```

#### `business_members`

- Miembros pueden verse dentro del negocio; solo admin/owner gestiona (MVP: si quieres simple, permite solo select).

```sql
drop policy if exists "business_members_select_member" on public.business_members;
create policy "business_members_select_member"
on public.business_members for select
using (public.is_business_member(business_id, auth.uid()));
```

#### `couriers`

- Admin/operator del negocio: CRUD
- Mensajero: puede verse a sí mismo.

```sql
drop policy if exists "couriers_select_member" on public.couriers;
create policy "couriers_select_member"
on public.couriers for select
using (public.is_business_member(business_id, auth.uid()) OR user_id = auth.uid());

drop policy if exists "couriers_modify_admin" on public.couriers;
create policy "couriers_modify_admin"
on public.couriers for all
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));
```

> Si quieres restringir “modify_admin” a role admin/owner, añadimos función `has_role(...)`. En MVP puede quedar así.

#### `customers`

```sql
drop policy if exists "customers_crud_member" on public.customers;
create policy "customers_crud_member"
on public.customers for all
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));
```

#### `orders`

- Negocio: CRUD sobre sus pedidos.
- Mensajero: puede ver pedidos asignados a él dentro del negocio.

```sql
drop policy if exists "orders_select_member" on public.orders;
create policy "orders_select_member"
on public.orders for select
using (
  public.is_business_member(business_id, auth.uid())
  OR assigned_courier_id = public.get_courier_id(business_id, auth.uid())
);

drop policy if exists "orders_modify_member" on public.orders;
create policy "orders_modify_member"
on public.orders for insert
with check (public.is_business_member(business_id, auth.uid()));

create policy "orders_update_member"
on public.orders for update
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));

create policy "orders_delete_member"
on public.orders for delete
using (public.is_business_member(business_id, auth.uid()));
```

> Recomendación: **mensajeros NO deberían actualizar `orders` directamente** (solo via Edge Function para transiciones). El panel sí puede.

#### `order_events`

- Negocio ve todos los eventos de su business.
- Mensajero ve eventos de pedidos asignados a él (o de eventos donde courier_id sea él).

```sql
drop policy if exists "order_events_select" on public.order_events;
create policy "order_events_select"
on public.order_events for select
using (
  public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
  OR order_id in (
    select o.id from public.orders o
    where o.business_id = order_events.business_id
      and o.assigned_courier_id = public.get_courier_id(o.business_id, auth.uid())
  )
);

drop policy if exists "order_events_insert_member" on public.order_events;
create policy "order_events_insert_member"
on public.order_events for insert
with check (public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
);
```

#### `order_proofs`

- Negocio ve todos.
- Mensajero solo de sus pedidos/asignaciones.

```sql
drop policy if exists "order_proofs_select" on public.order_proofs;
create policy "order_proofs_select"
on public.order_proofs for select
using (
  public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
);

drop policy if exists "order_proofs_insert" on public.order_proofs;
create policy "order_proofs_insert"
on public.order_proofs for insert
with check (
  courier_id = public.get_courier_id(business_id, auth.uid())
);
```

#### `courier_locations`

- Negocio puede leer ubicaciones de sus mensajeros.
- Mensajero puede insertar sus ubicaciones y leer las suyas.

```sql
drop policy if exists "courier_locations_select" on public.courier_locations;
create policy "courier_locations_select"
on public.courier_locations for select
using (
  public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
);

drop policy if exists "courier_locations_insert_self" on public.courier_locations;
create policy "courier_locations_insert_self"
on public.courier_locations for insert
with check (
  courier_id = public.get_courier_id(business_id, auth.uid())
);
```

#### `order_tracking_links`

- Solo negocio maneja links (NO público).

```sql
drop policy if exists "tracking_links_crud_member" on public.order_tracking_links;
create policy "tracking_links_crud_member"
on public.order_tracking_links for all
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));
```

---

## 5) Storage (bucket) para proofs

### Bucket recomendado

- `proofs` (privado)
- Subpaths: `proofs/<business_id>/<order_id>/<uuid>.jpg`

### Control de acceso

- Si lo haces privado, el panel obtiene **signed URLs**.
- Mensajero sube usando:

  - signed upload URL (Edge Function) o
  - Storage policy por `business_id`/`courier_id` (más complejo).

**Recomendación MVP**: **Edge Function** que:

1. valida que ese usuario es courier del business y tiene el pedido asignado
2. genera signed upload URL
3. luego registra `order_proofs` + evento `proof_uploaded`

---

## 6) Flujo completo de eventos (end-to-end)

### A) Creación y asignación (Panel)

1. Operador crea pedido (`orders.insert`)
2. Se crea evento:

   - `order_events: { type: order_created, to_status: pending }`

3. Operador asigna mensajero:

   - `orders.update: status=assigned, assigned_courier_id, assigned_at`
   - evento: `order_assigned` (meta: courier_id)

4. (opcional) push notification al mensajero: “Tienes 1 entrega asignada”.

### B) Aceptación y salida (Mensajero)

5. Mensajero abre app y ve “Asignados”
6. Mensajero “Aceptar” (opcional):

   - evento `courier_accepted`

7. Mensajero “En camino”:

   - transición `assigned -> en_route`
   - evento `status_changed { from_status, to_status }`
   - `orders.status = en_route`

> Recomendación: estas transiciones hacerlas por Edge Function `change_order_status` para validar reglas.

### C) Tracking ubicación (Mensajero → Realtime)

8. Mientras haya pedidos `assigned/en_route`:

   - cada 30–60s / 50–100m envía ping:

     - `courier_locations.insert { lat,lng,accuracy,speed,heading }`

9. Panel está suscrito a realtime:

   - actualiza mapa con última ubicación por courier.

### D) Entrega + comprobante

10. Mensajero marca “Entregado”:

- sube proof (foto/firma) → Storage
- inserta `order_proofs`
- evento `proof_uploaded` (meta: proof_id, type)

11. Transición `en_route -> delivered`:

- evento `status_changed`
- `orders.status=delivered`

12. Panel ve comprobante (signed url) y timeline.

### E) Fallido / cancelado / reasignación

- Fallido (mensajero):

  - evento `order_failed` (nota obligatoria)
  - `orders.status=failed`

- Cancelado (panel):

  - evento `order_canceled`
  - `orders.status=canceled`

- Reasignación:

  - `order_unassigned` + `order_assigned` + update `assigned_courier_id`

### F) Tracking público (cliente)

13. Operador genera link (Edge Function `create_tracking_link`)

- Crea token aleatorio (raw token solo se devuelve una vez)
- Guarda `token_hash` + `expires_at`

14. Cliente abre link:

- Edge Function `get_tracking_snapshot(token)`:

  - valida token_hash, expiración, revoked
  - devuelve:

    - estado del pedido
    - dropoff address (si quieres)
    - última ubicación del mensajero (si hay)
    - ETA (opcional)

**No uses RLS público** para esto en MVP: es más seguro y simple vía Edge Function.

---

## 7) Reglas de transición de estado (para tu Edge Function)

Reglas recomendadas:

- `pending -> assigned` (solo panel)
- `assigned -> en_route` (mensajero asignado)
- `en_route -> delivered` (mensajero asignado, con proof recomendado)
- `en_route -> failed` (mensajero asignado, con nota obligatoria)
- `assigned -> pending` (panel: desasignar)
- `* -> canceled` (panel)

Validaciones mínimas:

- solo el courier asignado puede cambiar a `en_route/delivered/failed`
- no permitir saltos ilógicos (ej. `pending -> delivered`)
- registrar siempre `order_events`

---

## 8) Qué endpoints/funciones (Edge Functions) haría sí o sí

1. `change_order_status(order_id, to_status, note?, proof_id?)`
2. `assign_order(order_id, courier_id)`
3. `create_tracking_link(order_id, expires_in_minutes)`
4. `get_tracking_snapshot(token)` (público)
5. `create_proof_upload(order_id, proof_type)` → devuelve signed upload URL y path

```ts
// supabase/functions/_shared/supabase.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

export function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "edge-functions" } },
  });
}

export function supabaseUser(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  // User client to validate JWT + get auth user (via getUser)
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });
}
```

```ts
// supabase/functions/_shared/http.ts
export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export function badRequest(
  message: string,
  extra: Record<string, unknown> = {}
) {
  return json(400, { error: message, ...extra });
}

export function unauthorized(message = "Unauthorized") {
  return json(401, { error: message });
}

export function forbidden(message = "Forbidden") {
  return json(403, { error: message });
}

export function ok(body: unknown) {
  return json(200, body);
}
```

```ts
// supabase/functions/_shared/crypto.ts
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

---

## Edge Function: `change_order_status` (TypeScript)

- Valida JWT del usuario.
- Carga `order` + (si aplica) `courier` del usuario.
- Aplica reglas de transición (como MVP).
- Actualiza `orders.status` (+ `updated_at` via trigger) y crea `order_events`.
- (Opcional) exige `proof_id` cuando pasa a `delivered` (lo dejo como “recomendado”, puedes activarlo).

```ts
// supabase/functions/change_order_status/index.ts
import { supabaseAdmin, supabaseUser } from "../_shared/supabase.ts";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  json,
} from "../_shared/http.ts";

type OrderStatus =
  | "pending"
  | "assigned"
  | "en_route"
  | "delivered"
  | "failed"
  | "canceled";

type Payload = {
  order_id: string;
  to_status: OrderStatus;
  note?: string | null;
  // if you want to tie proof to the status change:
  proof_id?: string | null;
};

function isValidStatus(s: string): s is OrderStatus {
  return [
    "pending",
    "assigned",
    "en_route",
    "delivered",
    "failed",
    "canceled",
  ].includes(s);
}

function allowedTransition(from: OrderStatus, to: OrderStatus): boolean {
  // MVP transitions
  if (from === to) return false;

  if (to === "canceled") return true; // panel can cancel from any state (you can restrict later)

  if (from === "pending" && to === "assigned") return true;
  if (from === "assigned" && (to === "en_route" || to === "pending"))
    return true; // pending means "unassigned"
  if (from === "en_route" && (to === "delivered" || to === "failed"))
    return true;

  return false;
}

function isCourierOnlyStatus(to: OrderStatus): boolean {
  return ["en_route", "delivered", "failed"].includes(to);
}

function isPanelOnlyTransition(from: OrderStatus, to: OrderStatus): boolean {
  // "unassign": assigned -> pending (panel)
  if (from === "assigned" && to === "pending") return true;
  // pending -> assigned (panel)
  if (from === "pending" && to === "assigned") return true;
  // cancel (panel) could be restricted here if desired
  return false;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supaUser = supabaseUser(req);
  const { data: authData, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !authData.user) return unauthorized();

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { order_id, to_status, note, proof_id } = payload ?? ({} as Payload);
  if (!order_id || typeof order_id !== "string")
    return badRequest("order_id is required");
  if (!to_status || typeof to_status !== "string" || !isValidStatus(to_status))
    return badRequest("to_status is invalid");

  const admin = supabaseAdmin();

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,business_id,status,assigned_courier_id")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) return badRequest("Order not found");

  const from_status = order.status as OrderStatus;
  if (!allowedTransition(from_status, to_status)) {
    return badRequest("Transition not allowed", { from_status, to_status });
  }

  // Determine if user is business member (panel) and/or courier (app)
  const userId = authData.user.id;

  const [{ data: membership }, { data: courier }] = await Promise.all([
    admin
      .from("business_members")
      .select("role,is_active")
      .eq("business_id", order.business_id)
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("couriers")
      .select("id,is_active")
      .eq("business_id", order.business_id)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const isMember = !!membership?.is_active;
  const courierId = courier?.is_active ? (courier.id as string) : null;

  // Authorization rules (MVP):
  // - Courier transitions (en_route/delivered/failed) require courier to be assigned.
  // - Panel transitions (assign/unassign/cancel) require business member.
  if (isCourierOnlyStatus(to_status)) {
    if (!courierId) return forbidden("Only couriers can set this status");
    if (!order.assigned_courier_id || order.assigned_courier_id !== courierId) {
      return forbidden("Courier is not assigned to this order");
    }
  }

  if (isPanelOnlyTransition(from_status, to_status)) {
    if (!isMember)
      return forbidden("Only business members can do this transition");
  }

  // Optional: require note on failed
  if (to_status === "failed" && (!note || note.trim().length < 3)) {
    return badRequest("note is required for failed orders");
  }

  // Optional: require proof on delivered (uncomment if you want strictness)
  // if (to_status === "delivered" && !proof_id) {
  //   return badRequest("proof_id is required to mark delivered");
  // }

  // Compute side effects
  const updates: Record<string, unknown> = { status: to_status };

  // If unassign (assigned -> pending) clear assignment
  if (from_status === "assigned" && to_status === "pending") {
    updates.assigned_courier_id = null;
    updates.assigned_at = null;
  }

  // Create event type
  const eventType =
    to_status === "canceled"
      ? "order_canceled"
      : to_status === "failed"
      ? "order_failed"
      : "status_changed";

  // Transaction-like sequence (Supabase JS doesn’t do SQL tx here; keep it tight)
  const { error: updErr } = await admin
    .from("orders")
    .update(updates)
    .eq("id", order_id);
  if (updErr)
    return json(500, {
      error: "Failed to update order",
      details: updErr.message,
    });

  const { error: evErr } = await admin.from("order_events").insert({
    business_id: order.business_id,
    order_id: order.id,
    type: eventType,
    from_status,
    to_status,
    courier_id: courierId,
    note: note ?? null,
    meta: proof_id ? { proof_id } : {},
    created_by: userId,
  });

  if (evErr)
    return json(500, {
      error: "Failed to insert event",
      details: evErr.message,
    });

  return ok({
    order_id,
    from_status,
    to_status,
    courier_id: courierId,
  });
});
```

---

## Edge Function: `get_tracking_snapshot` (TypeScript)

- Público (sin JWT). Recibe `token` (raw).
- Hash SHA-256 y busca en `order_tracking_links` por `token_hash`.
- Valida expiración/revocado.
- Devuelve:

  - estado del pedido, direcciones (si quieres), timestamps básicos
  - última ubicación del mensajero (si existe)

- No expone PII innecesaria (ajústalo).

```ts
// supabase/functions/get_tracking_snapshot/index.ts
import { supabaseAdmin } from "../_shared/supabase.ts";
import { ok, badRequest, forbidden, json } from "../_shared/http.ts";
import { sha256Hex } from "../_shared/crypto.ts";

type Snapshot = {
  order: {
    id: string;
    status: string;
    code: string | null;
    dropoff_address: string | null;
    updated_at: string;
  };
  courier?: {
    lat: number;
    lng: number;
    recorded_at: string;
    accuracy_m?: number | null;
  } | null;
};

Deno.serve(async (req) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.trim().length < 16)
    return badRequest("token is required");

  const admin = supabaseAdmin();
  const token_hash = await sha256Hex(token.trim());

  const { data: link, error: linkErr } = await admin
    .from("order_tracking_links")
    .select("order_id,business_id,expires_at,is_revoked")
    .eq("token_hash", token_hash)
    .maybeSingle();

  if (linkErr || !link) return forbidden("Invalid token");
  if (link.is_revoked) return forbidden("Link revoked");
  if (new Date(link.expires_at).getTime() < Date.now())
    return forbidden("Link expired");

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,status,code,dropoff_address,assigned_courier_id,updated_at")
    .eq("id", link.order_id)
    .eq("business_id", link.business_id)
    .single();

  if (orderErr || !order) return forbidden("Order not found");

  let courierLoc: Snapshot["courier"] = null;

  if (order.assigned_courier_id) {
    const { data: loc } = await admin
      .from("courier_locations")
      .select("lat,lng,accuracy_m,recorded_at")
      .eq("courier_id", order.assigned_courier_id)
      .eq("business_id", link.business_id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (loc) {
      courierLoc = {
        lat: loc.lat,
        lng: loc.lng,
        recorded_at: loc.recorded_at,
        accuracy_m: loc.accuracy_m,
      };
    }
  }

  const snapshot: Snapshot = {
    order: {
      id: order.id,
      status: order.status,
      code: order.code ?? null,
      dropoff_address: order.dropoff_address ?? null,
      updated_at: order.updated_at,
    },
    courier: courierLoc,
  };

  return ok(snapshot);
});
```

---

## Diagrama de Realtime subscriptions (qué escucha cada UI)

### 1) Panel del negocio (web/admin)

**Objetivo:** tablero de pedidos + mapa de mensajeros + timeline.

**Escucha (Realtime):**

- `orders`

  - filtros típicos: `business_id = <current_business>`
  - razón: actualizar tablero en vivo (asignaciones, cambios de status)

- `order_events`

  - filtros: `business_id = <current_business>`
  - razón: timeline en vivo (quién cambió qué y cuándo)

- `courier_locations`

  - filtros: `business_id = <current_business>`
  - razón: mapa “live” (posición de mensajeros)

**Lee (REST/SQL normal, no realtime o bajo demanda):**

- `order_proofs` (cuando abres un pedido)
- `couriers` (para listados/selector)
- `customers` (si los usas)

---

### 2) App del mensajero (Capacitor)

**Objetivo:** lista de asignaciones + cambios de estado + subir proofs.

**Escucha (Realtime):**

- `orders`

  - filtro: `assigned_courier_id = <myCourierId>`
  - razón: cuando te asignan/retiran pedidos

- `order_events`

  - filtro: pedidos asignados o `courier_id = <myCourierId>`
  - razón: timeline/confirmaciones

- (Opcional) `order_proofs`

  - filtro: `courier_id = <myCourierId>`
  - razón: si quieres reflejar que el proof quedó registrado

**Publica (writes):**

- `courier_locations.insert` (pings)
- cambios de estado: preferible **Edge Function** `change_order_status`
- proofs: preferible **Edge Function** para signed upload + insertar `order_proofs`

---

### 3) Tracking público (cliente, sin login)

**Objetivo:** ver estado + última ubicación.

**Recomendación MVP:** **NO Realtime directo** (sin auth).
Usa:

- polling cada 5–10s a `get_tracking_snapshot?token=...`, o
- SSE/websocket propio luego (si quieres).

Si luego quieres “live” sin polling:

- montas un pequeño gateway (Edge Function + Realtime con token efímero) o
- conviertes a “cliente con sesión” (menos deseable).

---

## Recomendación final (para que esto te quede sólido)

- Mantén Realtime solo para UIs autenticadas (panel + mensajero).
- Mantén tracking público por Edge Function (token hash + expiración + revoke).
- Para consistencia, fuerza transiciones por `change_order_status` (y en BD revocas updates directos por RLS más estricta cuando quieras).
