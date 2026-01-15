# Follow It - Especificación Detallada de Implementación

> Documento técnico para facilitar la implementación feature por feature.
> Basado en `docs/instructions.md` y el estado actual del proyecto.

---

## Índice

0. **[⚠️ LECTURA OBLIGATORIA: Estructura y Patrón de Implementación](#-lectura-obligatoria-estructura-y-patrón-de-implementación)** ⭐
1. [Base Implementada (No Rehacer)](#1-base-implementada)
2. [Estructura de Carpetas Propuesta](#2-estructura-de-carpetas)
3. [Módulo: Pedidos (Orders)](#3-módulo-pedidos-orders-✅-completado) ✅
4. [Módulo: Asignación de Mensajeros](#4-módulo-asignación)
5. [Módulo: Transiciones de Estado](#5-módulo-transiciones)
6. [Módulo: Comprobantes de Entrega (Proofs)](#6-módulo-comprobantes-de-entrega-proofs-✅-completado) ✅
7. [Módulo: Tracking GPS](#7-módulo-tracking-gps)
8. [Módulo: Tracking Público (Cliente)](#8-módulo-tracking-público)
9. [Módulo: Offline y Sincronización](#9-módulo-offline)
10. [Realtime: Suscripciones por Rol](#10-realtime)
11. [Componentes UI Reutilizables](#11-componentes-ui)
12. [Hooks Personalizados](#12-hooks)
13. [Validaciones (Zod Schemas)](#13-validaciones)
14. [Edge Functions Detalladas](#14-edge-functions)

---

## ⚠️ LECTURA OBLIGATORIA: Estructura y Patrón de Implementación

> **IMPORTANTE**: Antes de comenzar cualquier módulo nuevo, lee esta sección completa.
> Esta es la estructura base que debes seguir para mantener consistencia en el proyecto.

### 📋 Patrón de Implementación (Basado en Módulo 3: Pedidos)

Cada módulo debe seguir esta estructura y orden de implementación:

#### 1. **Tipos TypeScript** (`types/[modulo].ts`)

- Tipos base de la tabla (si aplica)
- Tipos extendidos con relaciones
- Tipos para formularios
- Tipos para filtros/búsqueda
- Configuraciones de estados (si aplica) con metadata UI

#### 2. **Constantes** (`lib/constants/[modulo].ts`)

- Estados posibles
- Transiciones permitidas
- Reglas de negocio
- Funciones helper de validación

#### 3. **Validaciones Zod** (`lib/validations/[modulo].ts`)

- Schema para crear
- Schema para actualizar
- Schema para filtros
- Exportar tipos inferidos

#### 4. **API Routes** (`app/api/[modulo]/route.ts`)

- `GET` - Listar con filtros y paginación
- `POST` - Crear nuevo
- `export const dynamic = 'force-dynamic'` (obligatorio)
- Validación de permisos (requireBusinessRole/requireCourierRole)
- Manejo de errores con tipos correctos (no `any`)

#### 5. **API Routes Individuales** (`app/api/[modulo]/[id]/route.ts`)

- `GET` - Obtener individual
- `PATCH` - Actualizar
- **IMPORTANTE**: `params` es Promise en Next.js 15+
  ```typescript
  { params }: { params: Promise<{ id: string }> }
  const { id } = await params;
  ```

#### 6. **Hooks Personalizados** (`lib/hooks/use[Modulo].ts`)

- Hook para lista: `use[Modulo]s()`
- Hook para individual: `use[Modulo]()`
- Estados: loading, error, data
- Funciones: refetch, create, update, delete

#### 7. **Componentes UI** (`components/[modulo]/`)

- Componentes de presentación (Card, Badge, etc.)
- Componentes de formulario (Form, Filters)
- Modales (DetailModal, CreateModal)
- **Usar clases base** de `lib/utils/formStyles.ts`

#### 8. **Páginas** (`app/dashboard/[modulo]/page.tsx`)

- Server Component que valida permisos
- Cliente Component con lógica
- **Usar modales** en lugar de rutas dinámicas (compatible con Capacitor)
- Responsive y mobile-first

### 🎯 Reglas de Implementación

#### ✅ HACER:

- ✅ Usar modales para detalles/edición (no rutas dinámicas `[id]`)
- ✅ Usar query params si necesitas navegación: `?id=xxx`
- ✅ Siempre `export const dynamic = 'force-dynamic'` en API routes
- ✅ `params` es Promise: usar `await params` o `const { id } = await params`
- ✅ Validar permisos server-side antes de cualquier operación
- ✅ Usar clases base de formularios (`formInputBase`, `formTextareaBase`)
- ✅ Manejar errores con tipos correctos (no `any`, usar `unknown`)
- ✅ Mobile-first: responsive, touch-friendly, safe areas
- ✅ Estados de loading, error, empty state
- ✅ Validación con Zod en cliente y servidor

#### ❌ NO HACER:

- ❌ Rutas dinámicas `[id]` (no compatible con exportación estática)
- ❌ Usar `any` en tipos TypeScript
- ❌ Acceder a `params.id` directamente (es Promise)
- ❌ Duplicar lógica de validación (usar Zod schemas)
- ❌ Olvidar `export const dynamic` en API routes
- ❌ Crear formularios sin usar clases base
- ❌ Ignorar estados de loading/error

### 📁 Estructura de Archivos por Módulo

```
types/
  └── [modulo].ts              # Tipos TypeScript

lib/
  ├── constants/
  │   └── [modulo].ts          # Constantes y reglas
  ├── validations/
  │   └── [modulo].ts          # Schemas Zod
  └── hooks/
      ├── use[Modulo]s.ts      # Hook para lista
      └── use[Modulo].ts       # Hook para individual

app/
  └── api/
      └── [modulo]/
          ├── route.ts         # GET (listar), POST (crear)
          └── [id]/
              └── route.ts     # GET (individual), PATCH (actualizar)

components/
  └── [modulo]/
      ├── [Modulo]Card.tsx     # Card de presentación
      ├── [Modulo]Form.tsx     # Formulario crear/editar
      ├── [Modulo]Filters.tsx  # Filtros de búsqueda
      └── [Modulo]DetailModal.tsx # Modal detalles/edición

app/
  └── dashboard/
      └── [modulo]/
          ├── page.tsx         # Server component
          └── [Modulo]PageClient.tsx # Client component
```

### 🔄 Flujo de Datos Típico

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UI Component                                                │
│       │                                                     │
│       ├── use[Modulo]s() hook                               │
│       │        │                                            │
│       │        ▼                                            │
│       │   GET /api/[modulo]                                 │
│       │        │                                            │
│       │        ▼                                            │
│       │   requireBusinessRole()                             │
│       │        │                                            │
│       │        ▼                                            │
│       │   Supabase Query (con RLS)                          │
│       │        │                                            │
│       │        ▼                                            │
│       │   Response JSON                                     │
│       │        │                                            │
│       │        ▼                                            │
│       │   Hook actualiza estado                            │
│       │        │                                            │
│       ▼        ▼                                            │
│  UI se re-renderiza                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📝 Checklist por Módulo

Antes de marcar un módulo como completado, verifica:

- [ ] Tipos TypeScript creados y exportados
- [ ] Constantes y reglas de negocio definidas
- [ ] Validaciones Zod implementadas
- [ ] API Routes con `dynamic = 'force-dynamic'`
- [ ] API Routes usan `await params` (Next.js 15+)
- [ ] Hooks personalizados funcionando
- [ ] Componentes UI usando clases base
- [ ] Modales en lugar de rutas dinámicas
- [ ] Responsive y mobile-friendly
- [ ] Estados de loading, error, empty
- [ ] Validación de permisos server-side
- [ ] Manejo de errores sin `any`
- [ ] Documentación actualizada en `docs/secciones.md`

### 🎨 Clases Base de Formularios (Reutilizar)

**Archivo**: `lib/utils/formStyles.ts`

```typescript
// Usar estas clases en TODOS los formularios
formInputBase; // Inputs de texto
formTextareaBase; // Textareas
formSelectBase; // Selects
formLabelBase; // Labels
formInputError; // Input con error
formTextareaError; // Textarea con error
formErrorBase; // Mensajes de error
formHintBase; // Mensajes de hint
```

### 📱 Optimizaciones Móviles (Aplicar siempre)

- Clase `touch-manipulation` en botones/interactivos
- Safe area insets para dispositivos con notch
- Tamaños mínimos de touch target (44px)
- Padding responsive (`p-4 md:p-6`)
- Grid responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Texto responsive (`text-sm md:text-base`)

### 🔍 Ejemplo Real: Módulo 3 (Pedidos)

**Referencia completa**: Ver sección [3. Módulo: Pedidos (Orders)](#3-módulo-pedidos-✅-completado)

Este módulo implementa todos los patrones descritos arriba y sirve como **plantilla base** para los demás módulos.

---

## 1. Base Implementada

### ✅ Sistema de Autenticación (Completo)

**Archivos existentes:**

```
lib/auth/actions.ts          → Server actions (login, register, logout, etc.)
lib/auth/client-actions.ts   → Acciones cliente
lib/hooks/useUser.ts         → Hook: usuario actual
lib/hooks/useUserRole.ts     → Hook: rol del usuario (business/courier)
lib/utils/auth.ts            → Helpers server-side (requireAuth, requireBusinessRole, etc.)
lib/supabase/client.ts       → Cliente Supabase (browser)
lib/supabase/server.ts       → Cliente Supabase (server components)
lib/supabase/middleware.ts   → Middleware de sesión
middleware.ts                → Protección de rutas
```

**Páginas auth existentes:**

```
app/auth/login/page.tsx
app/auth/register/page.tsx
app/auth/forgot-password/page.tsx
app/auth/reset-password/page.tsx
app/auth/verify-email/page.tsx
app/auth/callback/page.tsx
app/auth/onboarding/page.tsx
```

**NO TOCAR** - Solo extender si es necesario.

---

### ✅ Sistema de Invitaciones (Completo)

**Endpoints existentes:**

```
POST /api/couriers/invite    → Crear invitación (business)
POST /api/couriers/validate  → Validar código (courier)
POST /api/couriers/accept    → Aceptar invitación (courier)
GET  /api/couriers/invite    → Listar invitaciones (business)
```

**Página existente:**

```
app/dashboard/couriers/page.tsx         → Lista de mensajeros + invitaciones
app/dashboard/couriers/CouriersPageClient.tsx
```

---

## 2. Estructura de Carpetas Propuesta

```
app/
├── (public)/                          # Rutas públicas
│   ├── track/[token]/page.tsx         # Tracking público cliente
│   └── page.tsx                       # Landing (ya existe)
│
├── dashboard/                         # Panel negocio (protegido)
│   ├── layout.tsx                     # Layout con sidebar
│   ├── page.tsx                       # Dashboard principal (métricas)
│   ├── orders/
│   │   ├── page.tsx                   # Lista/tablero de pedidos
│   │   ├── new/page.tsx               # Crear pedido
│   │   └── [id]/page.tsx              # Detalle de pedido
│   ├── couriers/
│   │   └── page.tsx                   # (ya existe)
│   ├── map/
│   │   └── page.tsx                   # Mapa tiempo real
│   └── settings/
│       └── page.tsx                   # Configuración negocio
│
├── courier/                           # App mensajero (protegido)
│   ├── layout.tsx                     # Layout móvil
│   ├── page.tsx                       # Lista de pedidos asignados
│   ├── orders/
│   │   └── [id]/page.tsx              # Detalle + acciones
│   └── profile/
│       └── page.tsx                   # Perfil mensajero
│
├── api/
│   ├── couriers/                      # (ya existe)
│   ├── orders/
│   │   ├── route.ts                   # CRUD pedidos
│   │   └── [id]/
│   │       ├── route.ts               # GET/PATCH pedido
│   │       ├── assign/route.ts        # Asignar mensajero
│   │       └── events/route.ts        # Timeline eventos
│   ├── tracking/
│   │   └── route.ts                   # Crear link tracking
│   └── locations/
│       └── route.ts                   # Enviar ping ubicación

components/
├── ui/                                # (ya existe)
├── orders/
│   ├── OrderCard.tsx                  # Card de pedido
│   ├── OrderStatusBadge.tsx           # Badge de estado
│   ├── OrderForm.tsx                  # Formulario crear/editar
│   ├── OrderTimeline.tsx              # Timeline de eventos
│   ├── OrderFilters.tsx               # Filtros de búsqueda
│   ├── OrderKanban.tsx                # Vista Kanban
│   └── OrderList.tsx                  # Vista lista
├── couriers/
│   ├── CourierSelect.tsx              # Selector de mensajero
│   ├── CourierCard.tsx                # Card mensajero
│   └── CourierLocationMarker.tsx      # Marker en mapa
├── proofs/
│   ├── ProofCapture.tsx               # Captura foto/firma
│   ├── ProofGallery.tsx               # Galería de proofs
│   └── ProofViewer.tsx                # Visor individual
├── map/
│   ├── DeliveryMap.tsx                # Mapa principal
│   ├── CourierMarker.tsx              # Marker mensajero
│   └── OrderMarker.tsx                # Marker destino
├── tracking/
│   └── TrackingView.tsx               # Vista pública tracking
└── layout/
    ├── DashboardSidebar.tsx           # Sidebar negocio
    ├── CourierBottomNav.tsx           # Nav inferior mensajero
    └── Header.tsx                     # Header común

lib/
├── auth/                              # (ya existe)
├── supabase/                          # (ya existe)
├── hooks/
│   ├── useUser.ts                     # (ya existe)
│   ├── useUserRole.ts                 # (ya existe)
│   ├── useOrders.ts                   # CRUD + realtime pedidos
│   ├── useOrder.ts                    # Pedido individual
│   ├── useCouriers.ts                 # Lista mensajeros
│   ├── useCourierLocation.ts          # Ubicación mensajero
│   ├── useOrderEvents.ts              # Timeline eventos
│   ├── useRealtimeOrders.ts           # Suscripción realtime
│   └── useOfflineQueue.ts             # Cola offline
├── utils/
│   ├── auth.ts                        # (ya existe)
│   ├── orders.ts                      # Helpers de pedidos
│   ├── status.ts                      # Transiciones válidas
│   └── geo.ts                         # Helpers geolocalización
├── validations/
│   ├── order.ts                       # Schemas Zod pedidos
│   ├── proof.ts                       # Schemas proofs
│   └── location.ts                    # Schemas ubicación
└── constants/
    ├── orderStatus.ts                 # Estados y transiciones
    └── config.ts                      # Configuración app

types/
├── database.ts                        # (ya existe) - tipos Supabase
├── index.ts                           # (ya existe)
├── orders.ts                          # Tipos de pedidos
└── realtime.ts                        # Tipos eventos realtime
```

---

## 3. Módulo: Pedidos (Orders) ✅ COMPLETADO

> **Estado**: Implementado completamente
>
> - ✅ CRUD completo de pedidos
> - ✅ Lista con filtros y paginación
> - ✅ Crear/Editar pedidos en modales
> - ✅ Vista de detalles en modal
> - ✅ Validaciones con Zod
> - ✅ Hooks personalizados
> - ✅ Componentes UI reutilizables
> - ✅ Optimizado para móvil (Capacitor)

### 3.1 Modelo de Datos

**Tabla `orders` (ya definida en migrations):**

```sql
orders (
  id              uuid PRIMARY KEY,
  business_id     uuid NOT NULL,           -- Tenant
  code            text,                    -- Código visible: #A1023
  customer_id     uuid,                    -- Cliente (opcional)

  pickup_address  text,                    -- Dirección recogida (opcional)
  dropoff_address text NOT NULL,           -- Dirección entrega
  dropoff_lat     double precision,        -- Coordenadas destino
  dropoff_lng     double precision,

  notes           text,                    -- Notas internas
  items_summary   text,                    -- "2x combo, 1x agua"
  amount_cents    integer,                 -- Monto en centavos
  currency        text DEFAULT 'USD',

  status          order_status DEFAULT 'pending',
  assigned_courier_id uuid,                -- Mensajero asignado
  assigned_at     timestamptz,             -- Fecha asignación

  created_by      uuid,                    -- Quien creó
  created_at      timestamptz,
  updated_at      timestamptz              -- Auto-update via trigger
)
```

**Estados posibles (`order_status` enum):**

```typescript
type OrderStatus =
  | "pending" // Creado, sin asignar
  | "assigned" // Asignado a mensajero
  | "en_route" // En camino
  | "delivered" // Entregado
  | "failed" // Fallido
  | "canceled"; // Cancelado
```

---

### 3.2 TypeScript Types

**Archivo: `types/orders.ts`**

```typescript
import { Database } from "./database";

// Tipo base de la tabla
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

// Tipo extendido con relaciones
export type OrderWithRelations = Order & {
  courier?: {
    id: string;
    display_name: string;
    phone: string | null;
  } | null;
  customer?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  events?: OrderEvent[];
  proofs?: OrderProof[];
};

// Para el formulario
export type OrderFormData = {
  dropoff_address: string;
  pickup_address?: string;
  items_summary: string;
  notes?: string;
  amount_cents?: number;
  customer_name?: string;
  customer_phone?: string;
};

// Para filtros
export type OrderFilters = {
  status?: OrderStatus | "all";
  courier_id?: string | "all";
  date_from?: string;
  date_to?: string;
  search?: string; // código, dirección, teléfono
};

// Estados con metadata UI
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string; // Tailwind color
    bgColor: string;
    icon: string; // Lucide icon name
    allowedTransitions: OrderStatus[];
  }
> = {
  pending: {
    label: "Pendiente",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: "Clock",
    allowedTransitions: ["assigned", "canceled"],
  },
  assigned: {
    label: "Asignado",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: "User",
    allowedTransitions: ["en_route", "pending", "canceled"],
  },
  en_route: {
    label: "En Camino",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    icon: "Truck",
    allowedTransitions: ["delivered", "failed"],
  },
  delivered: {
    label: "Entregado",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: "CheckCircle",
    allowedTransitions: [],
  },
  failed: {
    label: "Fallido",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: "XCircle",
    allowedTransitions: ["assigned"], // Re-intentar
  },
  canceled: {
    label: "Cancelado",
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    icon: "Ban",
    allowedTransitions: [],
  },
};
```

---

### 3.3 Validación con Zod

**Archivo: `lib/validations/order.ts`**

```typescript
import { z } from "zod";

// Schema para crear pedido
export const createOrderSchema = z.object({
  dropoff_address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección es muy larga"),

  pickup_address: z.string().max(500).optional().nullable(),

  items_summary: z.string().min(2, "Describe los items").max(1000),

  notes: z.string().max(2000).optional().nullable(),

  amount_cents: z.number().int().min(0).optional().nullable(),

  dropoff_lat: z.number().min(-90).max(90).optional().nullable(),
  dropoff_lng: z.number().min(-180).max(180).optional().nullable(),

  // Cliente inline (opcional)
  customer_name: z.string().max(200).optional().nullable(),
  customer_phone: z.string().max(50).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Schema para actualizar pedido
export const updateOrderSchema = createOrderSchema.partial();

// Schema para asignar mensajero
export const assignOrderSchema = z.object({
  order_id: z.string().uuid("ID de pedido inválido"),
  courier_id: z.string().uuid("ID de mensajero inválido"),
});

// Schema para cambiar estado
export const changeStatusSchema = z.object({
  order_id: z.string().uuid(),
  to_status: z.enum([
    "pending",
    "assigned",
    "en_route",
    "delivered",
    "failed",
    "canceled",
  ]),
  note: z.string().max(1000).optional().nullable(),
  proof_id: z.string().uuid().optional().nullable(),
});

// Schema para filtros de búsqueda
export const orderFiltersSchema = z.object({
  status: z
    .enum([
      "pending",
      "assigned",
      "en_route",
      "delivered",
      "failed",
      "canceled",
      "all",
    ])
    .optional(),
  courier_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
```

---

### 3.4 API Routes

**Archivo: `app/api/orders/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";
import { createOrderSchema, orderFiltersSchema } from "@/lib/validations/order";

// GET /api/orders - Listar pedidos del negocio
export async function GET(request: NextRequest) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters = orderFiltersSchema.parse({
      status: searchParams.get("status") || undefined,
      courier_id: searchParams.get("courier_id") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 20,
    });

    // Query base
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        courier:couriers(id, display_name, phone),
        customer:customers(id, name, phone)
      `,
        { count: "exact" }
      )
      .eq("business_id", businessMember.business_id)
      .order("updated_at", { ascending: false });

    // Aplicar filtros
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.courier_id && filters.courier_id !== "all") {
      query = query.eq("assigned_courier_id", filters.courier_id);
    }
    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }
    if (filters.search) {
      query = query.or(
        `code.ilike.%${filters.search}%,dropoff_address.ilike.%${filters.search}%`
      );
    }

    // Paginación
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      orders: data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener pedidos" },
      { status: error.status || 500 }
    );
  }
}

// POST /api/orders - Crear pedido
export async function POST(request: NextRequest) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Generar código único
    const code = await generateOrderCode(supabase, businessMember.business_id);

    // Crear cliente si se proporcionó info
    let customer_id = null;
    if (data.customer_name || data.customer_phone) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          business_id: businessMember.business_id,
          name: data.customer_name,
          phone: data.customer_phone,
        })
        .select("id")
        .single();

      if (!customerError && customer) {
        customer_id = customer.id;
      }
    }

    // Crear pedido
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        business_id: businessMember.business_id,
        code,
        customer_id,
        dropoff_address: data.dropoff_address,
        pickup_address: data.pickup_address,
        dropoff_lat: data.dropoff_lat,
        dropoff_lng: data.dropoff_lng,
        items_summary: data.items_summary,
        notes: data.notes,
        amount_cents: data.amount_cents,
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Crear evento inicial
    await supabase.from("order_events").insert({
      business_id: businessMember.business_id,
      order_id: order.id,
      type: "order_created",
      to_status: "pending",
      created_by: user.id,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al crear pedido" },
      { status: error.status || 500 }
    );
  }
}

// Helper: Generar código único de pedido
async function generateOrderCode(
  supabase: any,
  businessId: string
): Promise<string> {
  const today = new Date();
  const prefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(today.getDate()).padStart(2, "0")}`;

  // Contar pedidos de hoy
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", today.toISOString().split("T")[0]);

  const sequence = String((count || 0) + 1).padStart(4, "0");
  return `#${prefix}-${sequence}`;
}
```

---

### 3.5 Hook: useOrders

**Archivo: `lib/hooks/useOrders.ts`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithRelations, OrderFilters } from "@/types/orders";

type UseOrdersReturn = {
  orders: OrderWithRelations[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: OrderFilters;
  setFilters: (filters: Partial<OrderFilters>) => void;
  refetch: () => Promise<void>;
  createOrder: (data: any) => Promise<{ order?: any; error?: string }>;
};

export function useOrders(
  initialFilters?: Partial<OrderFilters>
): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<OrderFilters>({
    status: "all",
    courier_id: "all",
    ...initialFilters,
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all")
        params.set("status", filters.status);
      if (filters.courier_id && filters.courier_id !== "all")
        params.set("courier_id", filters.courier_id);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      if (filters.search) params.set("search", filters.search);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset page on filter change
  }, []);

  const createOrder = useCallback(
    async (data: any) => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: result.error || "Error al crear pedido" };
        }

        // Refetch para actualizar lista
        await fetchOrders();
        return { order: result.order };
      } catch (err: any) {
        return { error: err.message };
      }
    },
    [fetchOrders]
  );

  return {
    orders,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch: fetchOrders,
    createOrder,
  };
}
```

---

### 3.6 Componentes UI de Pedidos

#### OrderStatusBadge.tsx

```typescript
// components/orders/OrderStatusBadge.tsx
"use client";

import { Clock, User, Truck, CheckCircle, XCircle, Ban } from "lucide-react";
import { ORDER_STATUS_CONFIG, type OrderStatus } from "@/types/orders";

type Props = {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
};

const ICONS = {
  Clock,
  User,
  Truck,
  CheckCircle,
  XCircle,
  Ban,
};

export function OrderStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: Props) {
  const config = ORDER_STATUS_CONFIG[status];
  const Icon = ICONS[config.icon as keyof typeof ICONS];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.color} ${sizeClasses[size]}
      `}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
```

#### OrderCard.tsx

```typescript
// components/orders/OrderCard.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Package, User, Clock } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderWithRelations } from "@/types/orders";

type Props = {
  order: OrderWithRelations;
  onClick?: () => void;
  selected?: boolean;
};

export function OrderCard({ order, onClick, selected }: Props) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        hover:shadow-md hover:border-blue-300
        ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}
      `}
    >
      {/* Header: Código + Estado */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-semibold text-gray-900">
          {order.code || `#${order.id.slice(0, 8)}`}
        </span>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      {/* Dirección */}
      <div className="flex items-start gap-2 mb-2">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 line-clamp-2">
          {order.dropoff_address}
        </p>
      </div>

      {/* Items */}
      {order.items_summary && (
        <div className="flex items-start gap-2 mb-2">
          <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 line-clamp-1">
            {order.items_summary}
          </p>
        </div>
      )}

      {/* Footer: Mensajero + Tiempo */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Mensajero asignado */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{order.courier?.display_name || "Sin asignar"}</span>
        </div>

        {/* Tiempo */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(order.updated_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
      </div>

      {/* Monto (si existe) */}
      {order.amount_cents && order.amount_cents > 0 && (
        <div className="mt-2 text-right">
          <span className="text-sm font-semibold text-green-600">
            ${(order.amount_cents / 100).toFixed(2)} {order.currency}
          </span>
        </div>
      )}
    </div>
  );
}
```

---

### 3.7 Página: Lista de Pedidos (Panel Negocio)

**Archivo: `app/dashboard/orders/page.tsx`**

```typescript
// app/dashboard/orders/page.tsx
import { Suspense } from "react";
import { requireBusinessRole } from "@/lib/utils/auth";
import { OrdersPageClient } from "./OrdersPageClient";

export default async function OrdersPage() {
  // Validar rol server-side
  const { user, businessMember } = await requireBusinessRole();

  return (
    <div className="p-6">
      <Suspense fallback={<OrdersPageSkeleton />}>
        <OrdersPageClient businessId={businessMember.business_id} />
      </Suspense>
    </div>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

**Archivo: `app/dashboard/orders/OrdersPageClient.tsx`**

```typescript
// app/dashboard/orders/OrdersPageClient.tsx
"use client";

import { useState } from "react";
import { Plus, List, LayoutGrid } from "lucide-react";
import { useOrders } from "@/lib/hooks/useOrders";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderForm } from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Props = {
  businessId: string;
};

type ViewMode = "list" | "kanban";

export function OrdersPageClient({ businessId }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const {
    orders,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch,
    createOrder,
  } = useOrders();

  const handleCreateOrder = async (data: any) => {
    const result = await createOrder(data);
    if (result.order) {
      setShowCreateModal(false);
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">
            {pagination.total} pedido{pagination.total !== 1 ? "s" : ""} en
            total
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle vista */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 ${
                viewMode === "kanban"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          {/* Crear pedido */}
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <OrderFilters filters={filters} onFilterChange={setFilters} />

      {/* Error */}
      {error && <Alert type="error" message={error} />}

      {/* Lista de pedidos */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              selected={order.id === selectedOrderId}
              onClick={() => setSelectedOrderId(order.id)}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setFilters({ ...filters })} // trigger refetch
        />
      )}

      {/* Modal crear pedido */}
      {showCreateModal && (
        <OrderFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateOrder}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
      <p className="text-gray-500 mb-4">
        Crea tu primer pedido para comenzar a gestionar entregas
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Pedido
      </Button>
    </div>
  );
}
```

---

## 4. Módulo: Asignación de Mensajeros

### 4.1 Flujo de Asignación

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE ASIGNACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PEDIDO (pending)                                           │
│       │                                                     │
│       ▼                                                     │
│  [Panel selecciona mensajero]                               │
│       │                                                     │
│       ▼                                                     │
│  POST /api/orders/[id]/assign                               │
│       │                                                     │
│       ▼                                                     │
│  Edge Function: assign_order                                │
│       │                                                     │
│       ├── Valida: usuario es business_member                │
│       ├── Valida: pedido está en 'pending'                  │
│       ├── Valida: courier pertenece al business             │
│       │                                                     │
│       ▼                                                     │
│  UPDATE orders SET                                          │
│    status = 'assigned',                                     │
│    assigned_courier_id = courier_id,                        │
│    assigned_at = now()                                      │
│       │                                                     │
│       ▼                                                     │
│  INSERT order_events (type: 'order_assigned')               │
│       │                                                     │
│       ▼                                                     │
│  Notificación Realtime (automática)                        │
│  └─> App mensajero recibe actualización en tiempo real      │
│  └─> Muestra toast/notificación visual                     │
│       │                                                     │
│       ▼                                                     │
│  PEDIDO (assigned) ✓                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 API Route: Asignar Pedido

**Archivo: `app/api/orders/[id]/assign/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";
import { z } from "zod";

const assignSchema = z.object({
  courier_id: z.string().uuid("ID de mensajero inválido"),
});

// POST /api/orders/[id]/assign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;

    // Validar body
    const body = await request.json();
    const { courier_id } = assignSchema.parse(body);

    // 1. Verificar que el pedido existe y está pending
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, business_id, code")
      .eq("id", orderId)
      .eq("business_id", businessMember.business_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `No se puede asignar un pedido en estado "${order.status}"` },
        { status: 400 }
      );
    }

    // 2. Verificar que el courier existe y pertenece al negocio
    const { data: courier, error: courierError } = await supabase
      .from("couriers")
      .select("id, display_name, is_active, user_id")
      .eq("id", courier_id)
      .eq("business_id", businessMember.business_id)
      .single();

    if (courierError || !courier) {
      return NextResponse.json(
        { error: "Mensajero no encontrado" },
        { status: 404 }
      );
    }

    if (!courier.is_active) {
      return NextResponse.json(
        { error: "El mensajero no está activo" },
        { status: 400 }
      );
    }

    // 3. Actualizar pedido
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "assigned",
        assigned_courier_id: courier_id,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // 4. Crear evento
    const { error: eventError } = await supabase.from("order_events").insert({
      business_id: businessMember.business_id,
      order_id: orderId,
      type: "order_assigned",
      from_status: "pending",
      to_status: "assigned",
      courier_id: courier_id,
      created_by: user.id,
      meta: { courier_name: courier.display_name },
    });

    if (eventError) {
      console.error("Error creating event:", eventError);
      // No fallar por esto, el pedido ya se actualizó
    }

    // 5. Notificación: Se envía automáticamente vía Supabase Realtime
    // El mensajero recibirá la notificación en tiempo real si tiene la app abierta
    // (gratis, sin configuración adicional necesaria)
    // Ver: lib/hooks/useCourierNotifications.ts

    return NextResponse.json({
      success: true,
      order_id: orderId,
      courier_id: courier_id,
      status: "assigned",
    });
  } catch (error: unknown) {
    console.error("POST /api/orders/[id]/assign error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: "errors" in error ? error.errors : [],
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error al asignar pedido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/orders/[id]/assign - Desasignar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;

    // 1. Verificar pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, business_id, assigned_courier_id")
      .eq("id", orderId)
      .eq("business_id", businessMember.business_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.status !== "assigned") {
      return NextResponse.json(
        { error: `Solo se puede desasignar pedidos en estado "assigned"` },
        { status: 400 }
      );
    }

    const previousCourierId = order.assigned_courier_id;

    // 2. Actualizar pedido
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "pending",
        assigned_courier_id: null,
        assigned_at: null,
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // 3. Crear evento
    await supabase.from("order_events").insert({
      business_id: businessMember.business_id,
      order_id: orderId,
      type: "order_unassigned",
      from_status: "assigned",
      to_status: "pending",
      courier_id: previousCourierId,
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      order_id: orderId,
      status: "pending",
    });
  } catch (error: any) {
    console.error("DELETE /api/orders/[id]/assign error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al desasignar pedido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```

---

### 4.3 Componente: CourierSelect

**Archivo: `components/couriers/CourierSelect.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { User, ChevronDown, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Courier = {
  id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
};

type Props = {
  businessId: string;
  value?: string | null;
  onChange: (courierId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  showUnassignOption?: boolean;
};

export function CourierSelect({
  businessId,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar mensajero",
  showUnassignOption = false,
}: Props) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchCouriers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("couriers")
        .select("id, display_name, phone, is_active")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("display_name");

      if (!error && data) {
        setCouriers(data);
      }
      setLoading(false);
    }

    fetchCouriers();
  }, [businessId]);

  const selectedCourier = couriers.find((c) => c.id === value);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          border rounded-lg bg-white text-left
          ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"
          }
          ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <span
            className={`truncate ${
              selectedCourier ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {selectedCourier?.display_name || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {showUnassignOption && value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sin asignar</span>
              </button>
            )}

            {couriers.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No hay mensajeros disponibles
              </div>
            ) : (
              couriers.map((courier) => (
                <button
                  key={courier.id}
                  type="button"
                  onClick={() => {
                    onChange(courier.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between
                    ${value === courier.id ? "bg-blue-50" : ""}
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {courier.display_name}
                      </p>
                      {courier.phone && (
                        <p className="text-xs text-gray-500 truncate">
                          {courier.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {value === courier.id && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

---

### 4.4 Modal: Asignar Pedido

**Archivo: `components/orders/AssignOrderModal.tsx`**

```typescript
"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { CourierSelect } from "@/components/couriers/CourierSelect";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { OrderWithRelations } from "@/types/orders";

type Props = {
  order: OrderWithRelations;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AssignOrderModal({
  order,
  businessId,
  onClose,
  onSuccess,
}: Props) {
  const [courierId, setCourierId] = useState<string | null>(
    order.assigned_courier_id
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAssigned = order.status === "assigned";
  const hasChanged = courierId !== order.assigned_courier_id;

  const handleSubmit = async () => {
    if (!courierId && !isAssigned) {
      setError("Selecciona un mensajero");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Si se quiere desasignar
      if (!courierId && isAssigned) {
        const response = await fetch(`/api/orders/${order.id}/assign`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }
      }
      // Si se quiere asignar/reasignar
      else if (courierId) {
        // Si ya está asignado, primero desasignar
        if (isAssigned && order.assigned_courier_id !== courierId) {
          await fetch(`/api/orders/${order.id}/assign`, { method: "DELETE" });
        }

        // Asignar nuevo
        if (order.status === "pending" || isAssigned) {
          const response = await fetch(`/api/orders/${order.id}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courier_id: courierId }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {isAssigned ? "Cambiar Asignación" : "Asignar Mensajero"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Info del pedido */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Pedido</p>
            <p className="font-mono font-semibold">{order.code}</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.dropoff_address}
            </p>
          </div>

          {/* Selector de mensajero */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mensajero
            </label>
            <CourierSelect
              businessId={businessId}
              value={courierId}
              onChange={setCourierId}
              showUnassignOption={isAssigned}
              placeholder="Seleccionar mensajero..."
            />
          </div>

          {/* Error */}
          {error && <Alert type="error" message={error} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !hasChanged}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isAssigned && !courierId ? "Desasignar" : "Asignar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4.5 Hook: useCouriers

**Archivo: `lib/hooks/useCouriers.ts`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Courier = {
  id: string;
  user_id: string;
  business_id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  // Stats calculados
  active_orders_count?: number;
  delivered_today_count?: number;
};

type UseCouriersReturn = {
  couriers: Courier[];
  activeCouriers: Courier[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCouriers(businessId: string): UseCouriersReturn {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Obtener mensajeros con conteo de pedidos activos
      const { data, error: fetchError } = await supabase
        .from("couriers")
        .select(
          `
          *,
          active_orders:orders(count)
        `
        )
        .eq("business_id", businessId)
        .eq("orders.status", "in", ["assigned", "en_route"])
        .order("display_name");

      if (fetchError) throw fetchError;

      // Transformar datos
      const couriersWithStats = (data || []).map((c) => ({
        ...c,
        active_orders_count: c.active_orders?.[0]?.count || 0,
      }));

      setCouriers(couriersWithStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const activeCouriers = couriers.filter((c) => c.is_active);

  return {
    couriers,
    activeCouriers,
    loading,
    error,
    refetch: fetchCouriers,
  };
}
```

---

## 5. Módulo: Transiciones de Estado

### 5.1 Reglas de Transición

```
┌─────────────────────────────────────────────────────────────┐
│                 MÁQUINA DE ESTADOS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ┌──────────┐                           │
│                      │ canceled │ ◄────────────────┐        │
│                      └──────────┘                  │        │
│                           ▲                        │        │
│                           │ (panel)                │        │
│                           │                        │        │
│  ┌─────────┐        ┌──────────┐        ┌──────────┐        │
│  │ pending │───────►│ assigned │───────►│ en_route │        │
│  └─────────┘ assign └──────────┘ start  └──────────┘        │
│       ▲                   │                   │             │
│       │                   │                   │             │
│       │ unassign          │                   ▼             │
│       └───────────────────┘          ┌──────────────┐       │
│                                      │  delivered   │       │
│                                      └──────────────┘       │
│                                             │               │
│                                             │               │
│                      ┌──────────┐           │               │
│                      │  failed  │ ◄─────────┘               │
│                      └──────────┘                           │
│                           │                                 │
│                           │ retry (re-assign)               │
│                           ▼                                 │
│                      ┌──────────┐                           │
│                      │ assigned │                           │
│                      └──────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

PERMISOS POR ROL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ Transición              │ Panel │ Mensajero │ Requiere     │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ pending → assigned      │  ✓    │     ✗     │ courier_id   │
│ assigned → pending      │  ✓    │     ✗     │ -            │
│ assigned → en_route     │  ✗    │     ✓     │ -            │
│ en_route → delivered    │  ✗    │     ✓     │ proof (rec)  │
│ en_route → failed       │  ✗    │     ✓     │ nota (req)   │
│ * → canceled            │  ✓    │     ✗     │ -            │
│ failed → assigned       │  ✓    │     ✗     │ courier_id   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 5.2 Constantes de Estado

**Archivo: `lib/constants/orderStatus.ts`**

```typescript
export type OrderStatus =
  | "pending"
  | "assigned"
  | "en_route"
  | "delivered"
  | "failed"
  | "canceled";

export type UserRole = "business" | "courier";

// Transiciones permitidas por estado actual
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["assigned", "canceled"],
  assigned: ["en_route", "pending", "canceled"],
  en_route: ["delivered", "failed"],
  delivered: [], // Estado final
  failed: ["assigned"], // Se puede reintentar
  canceled: [], // Estado final
};

// Transiciones que requieren ser del panel (business member)
export const PANEL_ONLY_TRANSITIONS: Array<{
  from: OrderStatus;
  to: OrderStatus;
}> = [
  { from: "pending", to: "assigned" },
  { from: "assigned", to: "pending" },
  { from: "failed", to: "assigned" },
  // Cancelar desde cualquier estado
  { from: "pending", to: "canceled" },
  { from: "assigned", to: "canceled" },
];

// Transiciones que requieren ser mensajero asignado
export const COURIER_ONLY_TRANSITIONS: Array<{
  from: OrderStatus;
  to: OrderStatus;
}> = [
  { from: "assigned", to: "en_route" },
  { from: "en_route", to: "delivered" },
  { from: "en_route", to: "failed" },
];

// Validar si una transición es válida
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Obtener quién puede hacer la transición
export function getTransitionRole(
  from: OrderStatus,
  to: OrderStatus
): UserRole | "both" | null {
  if (!isValidTransition(from, to)) return null;

  const isPanelOnly = PANEL_ONLY_TRANSITIONS.some(
    (t) => t.from === from && t.to === to
  );

  const isCourierOnly = COURIER_ONLY_TRANSITIONS.some(
    (t) => t.from === from && t.to === to
  );

  if (isPanelOnly) return "business";
  if (isCourierOnly) return "courier";
  return "both";
}

// Transiciones que requieren nota obligatoria
export const TRANSITIONS_REQUIRING_NOTE: Array<{
  from: OrderStatus;
  to: OrderStatus;
}> = [{ from: "en_route", to: "failed" }];

// Transiciones que recomiendan proof
export const TRANSITIONS_RECOMMENDING_PROOF: Array<{
  from: OrderStatus;
  to: OrderStatus;
}> = [{ from: "en_route", to: "delivered" }];

export function requiresNote(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS_REQUIRING_NOTE.some((t) => t.from === from && t.to === to);
}

export function recommendsProof(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS_RECOMMENDING_PROOF.some(
    (t) => t.from === from && t.to === to
  );
}
```

---

### 5.3 Edge Function: change_order_status (ya existe, pero detallada)

La Edge Function en `supabase/functions/change_order_status/index.ts` ya está implementada según `instructions.md`. Aquí está el flujo:

```
┌─────────────────────────────────────────────────────────────┐
│            change_order_status Edge Function                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT:                                                     │
│  {                                                          │
│    order_id: string,                                        │
│    to_status: OrderStatus,                                  │
│    note?: string,                                           │
│    proof_id?: string                                        │
│  }                                                          │
│                                                             │
│  VALIDACIONES:                                              │
│  1. JWT válido (usuario autenticado)                        │
│  2. Pedido existe                                           │
│  3. Transición permitida (from → to)                        │
│  4. Usuario tiene permiso:                                  │
│     - Panel: es business_member del business                │
│     - Courier: es el courier asignado                       │
│  5. Si to='failed': nota obligatoria                        │
│  6. (Opcional) Si to='delivered': proof recomendado         │
│                                                             │
│  ACCIONES:                                                  │
│  1. UPDATE orders SET status = to_status                    │
│     - Si unassign: clear assigned_courier_id                │
│  2. INSERT order_events con toda la metadata                │
│  3. (Futuro) Trigger notificaciones                         │
│                                                             │
│  OUTPUT:                                                    │
│  {                                                          │
│    order_id,                                                │
│    from_status,                                             │
│    to_status,                                               │
│    courier_id                                               │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.4 API Route para cambiar estado (wrapper de Edge Function)

**Archivo: `app/api/orders/[id]/status/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { changeStatusSchema } from "@/lib/validations/order";

// POST /api/orders/[id]/status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = changeStatusSchema.parse({
      order_id: params.id,
      ...body,
    });

    // Llamar a Edge Function
    const { data: result, error } = await supabase.functions.invoke(
      "change_order_status",
      {
        body: data,
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/orders/[id]/status error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al cambiar estado" },
      { status: 500 }
    );
  }
}
```

---

### 5.5 Componente: OrderActions (para mensajero)

**Archivo: `components/orders/OrderActions.tsx`**

```typescript
"use client";

import { useState } from "react";
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  isValidTransition,
  requiresNote,
  recommendsProof,
  type OrderStatus,
} from "@/lib/constants/orderStatus";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange: () => void;
  isCourier: boolean;
};

export function OrderActions({
  orderId,
  currentStatus,
  onStatusChange,
  isCourier,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");

  // Acciones disponibles para el mensajero
  const courierActions: Array<{
    toStatus: OrderStatus;
    label: string;
    icon: typeof Play;
    color: string;
    variant: "primary" | "success" | "danger";
  }> = [];

  if (isCourier) {
    if (currentStatus === "assigned") {
      courierActions.push({
        toStatus: "en_route",
        label: "Iniciar Entrega",
        icon: Play,
        color: "text-amber-600",
        variant: "primary",
      });
    }

    if (currentStatus === "en_route") {
      courierActions.push({
        toStatus: "delivered",
        label: "Marcar Entregado",
        icon: CheckCircle,
        color: "text-green-600",
        variant: "success",
      });
      courierActions.push({
        toStatus: "failed",
        label: "Marcar Fallido",
        icon: XCircle,
        color: "text-red-600",
        variant: "danger",
      });
    }
  }

  const handleAction = async (toStatus: OrderStatus) => {
    // Si requiere nota y no la tenemos, mostrar input
    if (requiresNote(currentStatus, toStatus) && !note.trim()) {
      setShowNoteInput(true);
      setError("Debes indicar el motivo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_status: toStatus,
          note: note.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Limpiar y notificar
      setNote("");
      setShowNoteInput(false);
      onStatusChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (courierActions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex flex-col gap-2">
        {courierActions.map((action) => (
          <Button
            key={action.toStatus}
            variant={action.variant}
            onClick={() => handleAction(action.toStatus)}
            disabled={loading}
            className="w-full justify-center py-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <action.icon className="w-5 h-5 mr-2" />
            )}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Input de nota (para failed) */}
      {showNoteInput && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Motivo del fallo *
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Cliente no estaba, dirección incorrecta..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Sugerencia de proof para delivered */}
      {currentStatus === "en_route" && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          <Camera className="w-4 h-4 inline mr-1" />
          Tip: Toma una foto como comprobante antes de marcar entregado
        </div>
      )}

      {/* Error */}
      {error && <Alert type="error" message={error} />}
    </div>
  );
}
```

---

## 6. Módulo: Comprobantes de Entrega (Proofs) ✅ COMPLETADO

### 6.1 Flujo Completo de Proof

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUJO DE COMPROBANTE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MENSAJERO (App)                                            │
│       │                                                     │
│       ▼                                                     │
│  [Toma foto / Captura firma]                                │
│       │                                                     │
│       ├── Obtiene geolocalización actual                    │
│       ├── Comprime imagen (max 1MB)                         │
│       │                                                     │
│       ▼                                                     │
│  POST /api/proofs/upload-url                                │
│       │                                                     │
│       ▼                                                     │
│  Edge Function: create_proof_upload                         │
│       │                                                     │
│       ├── Valida: courier asignado al pedido                │
│       ├── Genera: storage_path único                        │
│       ├── Genera: signed upload URL (5 min expiry)          │
│       │                                                     │
│       ▼                                                     │
│  RESPONSE: { uploadUrl, storagePath, proofId }              │
│       │                                                     │
│       ▼                                                     │
│  MENSAJERO sube archivo a uploadUrl (PUT)                   │
│       │                                                     │
│       ▼                                                     │
│  POST /api/proofs/confirm                                   │
│       │                                                     │
│       ├── Verifica que el archivo existe                    │
│       ├── INSERT order_proofs                               │
│       ├── INSERT order_events (proof_uploaded)              │
│       │                                                     │
│       ▼                                                     │
│  PROOF REGISTRADO ✓                                         │
│                                                             │
│  PANEL (Ver proof)                                          │
│       │                                                     │
│       ▼                                                     │
│  GET /api/proofs/[id]                                       │
│       │                                                     │
│       ▼                                                     │
│  Genera signed download URL (15 min expiry)                 │
│       │                                                     │
│       ▼                                                     │
│  MUESTRA IMAGEN ✓                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.2 Modelo de Datos

**Tabla `order_proofs` (ya definida):**

```sql
order_proofs (
  id            uuid PRIMARY KEY,
  business_id   uuid NOT NULL,
  order_id      uuid NOT NULL,
  courier_id    uuid,              -- Quién subió

  type          proof_type NOT NULL,  -- 'photo' | 'signature'
  storage_path  text NOT NULL,        -- proofs/<business>/<order>/<uuid>.jpg

  captured_at   timestamptz DEFAULT now(),
  lat           double precision,     -- Ubicación al capturar
  lng           double precision,

  created_at    timestamptz DEFAULT now()
)
```

**Storage bucket:** `proofs` (privado)

**Path pattern:** `proofs/{business_id}/{order_id}/{proof_id}.jpg`

---

### 6.3 TypeScript Types

**Archivo: `types/proofs.ts`**

```typescript
export type ProofType = "photo" | "signature";

export type OrderProof = {
  id: string;
  business_id: string;
  order_id: string;
  courier_id: string | null;
  type: ProofType;
  storage_path: string;
  captured_at: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  // Campos calculados (no en BD)
  signed_url?: string;
};

export type ProofUploadRequest = {
  order_id: string;
  type: ProofType;
  lat?: number;
  lng?: number;
};

export type ProofUploadResponse = {
  proof_id: string;
  upload_url: string;
  storage_path: string;
  expires_at: string;
};

export type ProofConfirmRequest = {
  proof_id: string;
  captured_at?: string;
};
```

---

### 6.4 Validaciones Zod

**Archivo: `lib/validations/proof.ts`**

```typescript
import { z } from "zod";

export const proofUploadSchema = z.object({
  order_id: z.string().uuid("ID de pedido inválido"),
  type: z.enum(["photo", "signature"], {
    errorMap: () => ({ message: 'Tipo debe ser "photo" o "signature"' }),
  }),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
});

export const proofConfirmSchema = z.object({
  proof_id: z.string().uuid("ID de proof inválido"),
  captured_at: z.string().datetime().optional(),
});

export type ProofUploadInput = z.infer<typeof proofUploadSchema>;
export type ProofConfirmInput = z.infer<typeof proofConfirmSchema>;
```

---

### 6.5 API Routes

**Archivo: `app/api/proofs/upload-url/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { proofUploadSchema } from "@/lib/validations/proof";

// POST /api/proofs/upload-url - Obtener URL de subida
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = proofUploadSchema.parse(body);

    // Verificar que el usuario es courier del pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        business_id,
        status,
        assigned_courier_id,
        courier:couriers!assigned_courier_id(id, user_id)
      `
      )
      .eq("id", data.order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que es el courier asignado
    if (!order.courier || order.courier.user_id !== user.id) {
      return NextResponse.json(
        { error: "No eres el mensajero asignado a este pedido" },
        { status: 403 }
      );
    }

    // Verificar estado válido para subir proof
    if (!["assigned", "en_route"].includes(order.status)) {
      return NextResponse.json(
        { error: "Solo puedes subir comprobantes en pedidos activos" },
        { status: 400 }
      );
    }

    // Generar ID y path
    const proofId = crypto.randomUUID();
    const extension = data.type === "signature" ? "png" : "jpg";
    const storagePath = `proofs/${order.business_id}/${order.id}/${proofId}.${extension}`;

    // Crear registro preliminar en BD
    const { error: insertError } = await supabase.from("order_proofs").insert({
      id: proofId,
      business_id: order.business_id,
      order_id: order.id,
      courier_id: order.assigned_courier_id,
      type: data.type,
      storage_path: storagePath,
      lat: data.lat,
      lng: data.lng,
      captured_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // Generar signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("proofs")
      .createSignedUploadUrl(storagePath, {
        upsert: false,
      });

    if (uploadError) {
      // Rollback: eliminar registro
      await supabase.from("order_proofs").delete().eq("id", proofId);
      throw uploadError;
    }

    return NextResponse.json({
      proof_id: proofId,
      upload_url: uploadData.signedUrl,
      storage_path: storagePath,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
    });
  } catch (error: any) {
    console.error("POST /api/proofs/upload-url error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al generar URL de subida" },
      { status: 500 }
    );
  }
}
```

**Archivo: `app/api/proofs/confirm/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { proofConfirmSchema } from "@/lib/validations/proof";

// POST /api/proofs/confirm - Confirmar que el archivo se subió
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = proofConfirmSchema.parse(body);

    // Obtener proof
    const { data: proof, error: proofError } = await supabase
      .from("order_proofs")
      .select("*, courier:couriers(user_id)")
      .eq("id", data.proof_id)
      .single();

    if (proofError || !proof) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que es el courier
    if (proof.courier?.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el archivo existe en storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("proofs")
      .list(proof.storage_path.replace(/\/[^/]+$/, ""), {
        search: proof.storage_path.split("/").pop(),
      });

    if (fileError || !fileData?.length) {
      return NextResponse.json(
        { error: "El archivo no se subió correctamente" },
        { status: 400 }
      );
    }

    // Actualizar captured_at si se proporcionó
    if (data.captured_at) {
      await supabase
        .from("order_proofs")
        .update({ captured_at: data.captured_at })
        .eq("id", data.proof_id);
    }

    // Crear evento
    await supabase.from("order_events").insert({
      business_id: proof.business_id,
      order_id: proof.order_id,
      type: "proof_uploaded",
      courier_id: proof.courier_id,
      created_by: user.id,
      meta: {
        proof_id: proof.id,
        proof_type: proof.type,
      },
    });

    return NextResponse.json({
      success: true,
      proof_id: proof.id,
    });
  } catch (error: any) {
    console.error("POST /api/proofs/confirm error:", error);
    return NextResponse.json(
      { error: error.message || "Error al confirmar comprobante" },
      { status: 500 }
    );
  }
}
```

**Archivo: `app/api/proofs/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/proofs/[id] - Obtener proof con signed URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener proof (RLS se encarga de permisos)
    const { data: proof, error } = await supabase
      .from("order_proofs")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !proof) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      );
    }

    // Generar signed URL para ver
    const { data: urlData, error: urlError } = await supabase.storage
      .from("proofs")
      .createSignedUrl(proof.storage_path, 15 * 60); // 15 min

    if (urlError) throw urlError;

    return NextResponse.json({
      ...proof,
      signed_url: urlData.signedUrl,
    });
  } catch (error: any) {
    console.error("GET /api/proofs/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener comprobante" },
      { status: 500 }
    );
  }
}
```

---

### 6.6 Hook: useProofCapture

**Archivo: `lib/hooks/useProofCapture.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import type { ProofType, ProofUploadResponse } from "@/types/proofs";

type UseProofCaptureReturn = {
  uploading: boolean;
  progress: number;
  error: string | null;
  captureAndUpload: (
    orderId: string,
    type: ProofType,
    file: File | Blob,
    location?: { lat: number; lng: number }
  ) => Promise<{ proofId?: string; error?: string }>;
};

export function useProofCapture(): UseProofCaptureReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const captureAndUpload = useCallback(
    async (
      orderId: string,
      type: ProofType,
      file: File | Blob,
      location?: { lat: number; lng: number }
    ) => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 1. Obtener URL de subida
        setProgress(10);
        const uploadUrlResponse = await fetch("/api/proofs/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            type,
            lat: location?.lat,
            lng: location?.lng,
          }),
        });

        if (!uploadUrlResponse.ok) {
          const data = await uploadUrlResponse.json();
          throw new Error(data.error || "Error al obtener URL de subida");
        }

        const uploadData: ProofUploadResponse = await uploadUrlResponse.json();
        setProgress(30);

        // 2. Subir archivo
        const uploadResponse = await fetch(uploadData.upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": type === "signature" ? "image/png" : "image/jpeg",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir archivo");
        }
        setProgress(70);

        // 3. Confirmar subida
        const confirmResponse = await fetch("/api/proofs/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proof_id: uploadData.proof_id,
            captured_at: new Date().toISOString(),
          }),
        });

        if (!confirmResponse.ok) {
          const data = await confirmResponse.json();
          throw new Error(data.error || "Error al confirmar subida");
        }

        setProgress(100);
        return { proofId: uploadData.proof_id };
      } catch (err: any) {
        setError(err.message);
        return { error: err.message };
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return {
    uploading,
    progress,
    error,
    captureAndUpload,
  };
}
```

---

### 6.7 Componente: ProofCapture (Captura de foto)

**Archivo: `components/proofs/ProofCapture.tsx`**

```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Check, Loader2, RotateCcw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProofCapture } from "@/lib/hooks/useProofCapture";

type Props = {
  orderId: string;
  onSuccess: (proofId: string) => void;
  onCancel: () => void;
};

export function ProofCapture({ orderId, onSuccess, onCancel }: Props) {
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [gettingLocation, setGettingLocation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { uploading, progress, error, captureAndUpload } = useProofCapture();

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Convertir a blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedImage(URL.createObjectURL(blob));
          setMode("preview");
          stopCamera();
        }
      },
      "image/jpeg",
      0.8 // Calidad 80%
    );
  }, [stopCamera]);

  // Obtener ubicación
  const getLocation = useCallback(async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (err) {
      console.error("Error getting location:", err);
    } finally {
      setGettingLocation(false);
    }
  }, []);

  // Reintentar foto
  const retake = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setMode("camera");
    startCamera();
  }, [startCamera]);

  // Subir foto
  const handleUpload = useCallback(async () => {
    if (!capturedBlob) return;

    const result = await captureAndUpload(
      orderId,
      "photo",
      capturedBlob,
      location || undefined
    );

    if (result.proofId) {
      onSuccess(result.proofId);
    }
  }, [capturedBlob, orderId, location, captureAndUpload, onSuccess]);

  // Cancelar
  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  // Iniciar cámara al montar
  useState(() => {
    startCamera();
    getLocation();
    return () => stopCamera();
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button onClick={handleCancel} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium">Tomar Foto</span>
        <div className="w-10" />
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {mode === "camera" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={capturedImage!}
            alt="Captured"
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* Canvas oculto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Location indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
          <MapPin
            className={`w-4 h-4 ${
              location ? "text-green-400" : "text-gray-400"
            }`}
          />
          <span className="text-white text-sm">
            {gettingLocation ? "Obteniendo..." : location ? "GPS ✓" : "Sin GPS"}
          </span>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white text-center mt-2 text-sm">
              Subiendo... {progress}%
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        {mode === "camera" ? (
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full border-4 border-black" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              onClick={retake}
              disabled={uploading}
              className="text-white"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Repetir
            </Button>

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="px-8"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              Usar Foto
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-center mt-4 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
```

---

### 6.8 Componente: ProofGallery (Ver comprobantes)

**Archivo: `components/proofs/ProofGallery.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Image, FileSignature, MapPin, Clock, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { OrderProof } from "@/types/proofs";

type Props = {
  orderId: string;
};

export function ProofGallery({ orderId }: Props) {
  const [proofs, setProofs] = useState<OrderProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<OrderProof | null>(null);

  useEffect(() => {
    async function fetchProofs() {
      try {
        const response = await fetch(`/api/orders/${orderId}/proofs`);
        const data = await response.json();

        if (response.ok) {
          setProofs(data.proofs || []);
        }
      } catch (err) {
        console.error("Error fetching proofs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProofs();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Sin comprobantes</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        {proofs.map((proof) => (
          <button
            key={proof.id}
            onClick={() => setSelectedProof(proof)}
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity relative"
          >
            {proof.signed_url ? (
              <img
                src={proof.signed_url}
                alt={proof.type}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {proof.type === "photo" ? (
                  <Image className="w-8 h-8 text-gray-400" />
                ) : (
                  <FileSignature className="w-8 h-8 text-gray-400" />
                )}
              </div>
            )}

            {/* Badge tipo */}
            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
              {proof.type === "photo" ? "📷" : "✍️"}
            </span>
          </button>
        ))}
      </div>

      {/* Modal visor */}
      {selectedProof && (
        <ProofViewer
          proof={selectedProof}
          onClose={() => setSelectedProof(null)}
        />
      )}
    </>
  );
}

// Componente visor
function ProofViewer({
  proof,
  onClose,
}: {
  proof: OrderProof;
  onClose: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    proof.signed_url || null
  );
  const [loading, setLoading] = useState(!proof.signed_url);

  useEffect(() => {
    if (!proof.signed_url) {
      // Obtener signed URL
      fetch(`/api/proofs/${proof.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.signed_url) {
            setImageUrl(data.signed_url);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [proof]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="text-white">
          <p className="font-medium">
            {proof.type === "photo" ? "Foto" : "Firma"}
          </p>
          <p className="text-sm text-gray-400">
            <Clock className="w-3 h-3 inline mr-1" />
            {formatDistanceToNow(new Date(proof.captured_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Imagen */}
      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={proof.type}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <p className="text-gray-400">Error al cargar imagen</p>
        )}
      </div>

      {/* Footer con ubicación */}
      {proof.lat && proof.lng && (
        <div className="p-4 bg-black/50">
          <div className="flex items-center gap-2 text-white text-sm">
            <MapPin className="w-4 h-4" />
            <span>
              {proof.lat.toFixed(6)}, {proof.lng.toFixed(6)}
            </span>
            <a
              href={`https://maps.google.com/?q=${proof.lat},${proof.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline ml-2"
            >
              Ver en mapa
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Módulo: Tracking GPS

### 7.1 Flujo de Tracking

```
┌─────────────────────────────────────────────────────────────┐
│                   TRACKING GPS FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  APP MENSAJERO                                              │
│       │                                                     │
│       ├── ¿Tiene pedidos activos (assigned/en_route)?       │
│       │        │                                            │
│       │        NO → Tracking APAGADO                        │
│       │        │                                            │
│       │        SÍ → Tracking ACTIVO                         │
│       │                │                                    │
│       │                ▼                                    │
│       │        [Watchdog cada 30-60s]                       │
│       │                │                                    │
│       │                ├── Si movió >50m desde último ping  │
│       │                │   O pasaron >60s                   │
│       │                │                                    │
│       │                ▼                                    │
│       │        POST /api/locations                          │
│       │                │                                    │
│       │                ▼                                    │
│       │        INSERT courier_locations                     │
│       │                │                                    │
│       │                ▼                                    │
│       │        [Realtime broadcast]                         │
│       │                                                     │
│  PANEL NEGOCIO                                              │
│       │                                                     │
│       ├── Subscribe realtime: courier_locations             │
│       │        │                                            │
│       │        ▼                                            │
│       │   [Actualiza mapa con última posición]              │
│       │                                                     │
│  OFFLINE HANDLING                                           │
│       │                                                     │
│       ├── Si no hay conexión:                               │
│       │   - Almacenar pings en cola local                   │
│       │   - Max 50 pings en cola                            │
│       │   - Descartar los más viejos si excede              │
│       │                                                     │
│       ├── Cuando vuelve conexión:                           │
│       │   - Enviar batch de pings                           │
│       │   - Priorizar los más recientes                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 7.2 Modelo de Datos

**Tabla `courier_locations` (ya definida):**

```sql
courier_locations (
  id           bigserial PRIMARY KEY,
  business_id  uuid NOT NULL,
  courier_id   uuid NOT NULL,

  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  accuracy_m   double precision,         -- Precisión en metros
  speed_mps    double precision,         -- Velocidad m/s
  heading      double precision,         -- Dirección 0-360

  recorded_at  timestamptz DEFAULT now() -- Cuándo se capturó
)

-- Índice para queries por courier y tiempo
CREATE INDEX idx_courier_locations_courier_time
ON courier_locations (courier_id, recorded_at DESC);
```

---

### 7.3 TypeScript Types

**Archivo: `types/location.ts`**

```typescript
export type CourierLocation = {
  id: number;
  business_id: string;
  courier_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  speed_mps: number | null;
  heading: number | null;
  recorded_at: string;
};

export type LocationPing = {
  lat: number;
  lng: number;
  accuracy_m?: number;
  speed_mps?: number;
  heading?: number;
  recorded_at?: string; // ISO string, para offline
};

export type CourierWithLocation = {
  id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  last_location?: {
    lat: number;
    lng: number;
    recorded_at: string;
    accuracy_m?: number;
  } | null;
  active_orders_count: number;
};
```

---

### 7.4 Validación Zod

**Archivo: `lib/validations/location.ts`**

```typescript
import { z } from "zod";

export const locationPingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy_m: z.number().min(0).max(10000).optional(),
  speed_mps: z.number().min(0).max(100).optional(), // Max ~360 km/h
  heading: z.number().min(0).max(360).optional(),
  recorded_at: z.string().datetime().optional(),
});

export const locationBatchSchema = z.object({
  pings: z.array(locationPingSchema).min(1).max(50),
});

export type LocationPingInput = z.infer<typeof locationPingSchema>;
export type LocationBatchInput = z.infer<typeof locationBatchSchema>;
```

---

### 7.5 API Route: Enviar Ubicación

**Archivo: `app/api/locations/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  locationPingSchema,
  locationBatchSchema,
} from "@/lib/validations/location";

// POST /api/locations - Enviar ping de ubicación
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener courier del usuario
    const { data: courier, error: courierError } = await supabase
      .from("couriers")
      .select("id, business_id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (courierError || !courier) {
      return NextResponse.json(
        { error: "No eres un mensajero activo" },
        { status: 403 }
      );
    }

    // Verificar que tiene pedidos activos
    const { count: activeOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("assigned_courier_id", courier.id)
      .in("status", ["assigned", "en_route"]);

    if (!activeOrders || activeOrders === 0) {
      return NextResponse.json(
        { error: "No tienes pedidos activos, tracking deshabilitado" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Soportar ping individual o batch
    let pings: any[];
    if (body.pings) {
      const batch = locationBatchSchema.parse(body);
      pings = batch.pings;
    } else {
      const ping = locationPingSchema.parse(body);
      pings = [ping];
    }

    // Insertar pings
    const inserts = pings.map((ping) => ({
      business_id: courier.business_id,
      courier_id: courier.id,
      lat: ping.lat,
      lng: ping.lng,
      accuracy_m: ping.accuracy_m,
      speed_mps: ping.speed_mps,
      heading: ping.heading,
      recorded_at: ping.recorded_at || new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("courier_locations")
      .insert(inserts);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      count: pings.length,
    });
  } catch (error: any) {
    console.error("POST /api/locations error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de ubicación inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al guardar ubicación" },
      { status: 500 }
    );
  }
}
```

---

### 7.6 Hook: useLocationTracking (Mensajero)

**Archivo: `lib/hooks/useLocationTracking.ts`**

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { LocationPing } from "@/types/location";

type TrackingConfig = {
  intervalMs: number; // Intervalo mínimo entre pings (default: 30000)
  minDistanceM: number; // Distancia mínima para nuevo ping (default: 50)
  maxQueueSize: number; // Máximo pings en cola offline (default: 50)
};

type UseLocationTrackingReturn = {
  isTracking: boolean;
  lastLocation: LocationPing | null;
  error: string | null;
  offlineQueueSize: number;
  startTracking: () => void;
  stopTracking: () => void;
};

const DEFAULT_CONFIG: TrackingConfig = {
  intervalMs: 30000, // 30 segundos
  minDistanceM: 50, // 50 metros
  maxQueueSize: 50,
};

// Calcular distancia entre dos puntos (Haversine)
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useLocationTracking(
  hasActiveOrders: boolean,
  config: Partial<TrackingConfig> = {}
): UseLocationTrackingReturn {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationPing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<LocationPing[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(
    null
  );

  // Enviar ping al servidor
  const sendPing = useCallback(async (ping: LocationPing) => {
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ping),
      });

      if (!response.ok) {
        throw new Error("Failed to send location");
      }

      lastSentRef.current = {
        lat: ping.lat,
        lng: ping.lng,
        time: Date.now(),
      };

      return true;
    } catch (err) {
      console.error("Error sending location:", err);
      return false;
    }
  }, []);

  // Enviar cola offline
  const flushOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pings: offlineQueue }),
      });

      if (response.ok) {
        setOfflineQueue([]);
      }
    } catch (err) {
      console.error("Error flushing offline queue:", err);
    }
  }, [offlineQueue]);

  // Manejar nueva posición
  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      const ping: LocationPing = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy,
        speed_mps: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
        recorded_at: new Date().toISOString(),
      };

      setLastLocation(ping);
      setError(null);

      // Verificar si debemos enviar
      const last = lastSentRef.current;
      const now = Date.now();

      let shouldSend = false;

      if (!last) {
        // Primer ping
        shouldSend = true;
      } else {
        const distance = getDistanceMeters(
          last.lat,
          last.lng,
          ping.lat,
          ping.lng
        );
        const timeDiff = now - last.time;

        // Enviar si: pasó el intervalo mínimo O se movió suficiente
        if (timeDiff >= cfg.intervalMs || distance >= cfg.minDistanceM) {
          shouldSend = true;
        }
      }

      if (shouldSend) {
        sendPing(ping).then((success) => {
          if (!success && navigator.onLine === false) {
            // Agregar a cola offline
            setOfflineQueue((prev) => {
              const newQueue = [...prev, ping];
              // Limitar tamaño
              if (newQueue.length > cfg.maxQueueSize) {
                return newQueue.slice(-cfg.maxQueueSize);
              }
              return newQueue;
            });
          }
        });
      }
    },
    [cfg, sendPing]
  );

  // Manejar error de geolocalización
  const handleError = useCallback((err: GeolocationPositionError) => {
    console.error("Geolocation error:", err);
    setError(
      err.code === 1
        ? "Permiso de ubicación denegado"
        : err.code === 2
        ? "Ubicación no disponible"
        : "Error obteniendo ubicación"
    );
  }, []);

  // Iniciar tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada");
      return;
    }

    if (watchIdRef.current !== null) return; // Ya está activo

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
      }
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
    setError(null);
  }, [handlePosition, handleError]);

  // Detener tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Auto-start/stop basado en pedidos activos
  useEffect(() => {
    if (hasActiveOrders && !isTracking) {
      startTracking();
    } else if (!hasActiveOrders && isTracking) {
      stopTracking();
    }
  }, [hasActiveOrders, isTracking, startTracking, stopTracking]);

  // Flush offline queue cuando vuelve conexión
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flushOfflineQueue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    lastLocation,
    error,
    offlineQueueSize: offlineQueue.length,
    startTracking,
    stopTracking,
  };
}
```

---

### 7.7 Hook: useRealtimeLocations (Panel)

**Archivo: `lib/hooks/useRealtimeLocations.ts`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CourierWithLocation } from "@/types/location";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type UseRealtimeLocationsReturn = {
  couriers: CourierWithLocation[];
  loading: boolean;
  error: string | null;
};

export function useRealtimeLocations(
  businessId: string
): UseRealtimeLocationsReturn {
  const [couriers, setCouriers] = useState<CourierWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inicial
  const fetchCouriersWithLocations = useCallback(async () => {
    try {
      const supabase = createClient();

      // Obtener mensajeros activos
      const { data: couriersData, error: couriersError } = await supabase
        .from("couriers")
        .select("id, display_name, phone, is_active")
        .eq("business_id", businessId)
        .eq("is_active", true);

      if (couriersError) throw couriersError;

      // Obtener última ubicación de cada uno
      const couriersWithLocations: CourierWithLocation[] = await Promise.all(
        (couriersData || []).map(async (courier) => {
          // Última ubicación
          const { data: locationData } = await supabase
            .from("courier_locations")
            .select("lat, lng, recorded_at, accuracy_m")
            .eq("courier_id", courier.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .single();

          // Pedidos activos
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("assigned_courier_id", courier.id)
            .in("status", ["assigned", "en_route"]);

          return {
            ...courier,
            last_location: locationData || null,
            active_orders_count: count || 0,
          };
        })
      );

      setCouriers(couriersWithLocations);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Setup inicial + realtime
  useEffect(() => {
    fetchCouriersWithLocations();

    const supabase = createClient();

    // Suscribirse a cambios en courier_locations
    const channel = supabase
      .channel("courier-locations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "courier_locations",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newLocation = payload.new;

          // Actualizar ubicación del courier
          setCouriers((prev) =>
            prev.map((courier) => {
              if (courier.id === newLocation.courier_id) {
                return {
                  ...courier,
                  last_location: {
                    lat: newLocation.lat,
                    lng: newLocation.lng,
                    recorded_at: newLocation.recorded_at,
                    accuracy_m: newLocation.accuracy_m,
                  },
                };
              }
              return courier;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchCouriersWithLocations]);

  return {
    couriers,
    loading,
    error,
  };
}
```

---

## 8. Módulo: Tracking Público (Cliente)

### 8.1 Flujo de Tracking Público

```
┌─────────────────────────────────────────────────────────────┐
│                TRACKING PÚBLICO (SIN LOGIN)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NEGOCIO genera link:                                       │
│       │                                                     │
│       ▼                                                     │
│  POST Edge Function: create_tracking_link                   │
│       │                                                     │
│       ├── Genera token aleatorio (32 chars)                 │
│       ├── Hashea token (SHA-256)                            │
│       ├── Guarda hash + expires_at en order_tracking_links  │
│       ├── Retorna: token RAW (solo una vez)                 │
│       │                                                     │
│       ▼                                                     │
│  URL: https://app.com/track/[token]                         │
│       │                                                     │
│  CLIENTE abre link:                                         │
│       │                                                     │
│       ▼                                                     │
│  GET Edge Function: get_tracking_snapshot                   │
│       │                                                     │
│       ├── Hashea token recibido                             │
│       ├── Busca en order_tracking_links por hash            │
│       ├── Valida: no expirado, no revocado                  │
│       │                                                     │
│       ▼                                                     │
│  RETORNA (sin auth):                                        │
│       - Estado del pedido                                   │
│       - Dirección de entrega (parcial)                      │
│       - Última ubicación del mensajero                      │
│       - Timestamp última actualización                      │
│                                                             │
│  UI CLIENTE:                                                │
│       │                                                     │
│       ├── Polling cada 10-15 segundos                       │
│       ├── Muestra mapa con posición mensajero               │
│       ├── Muestra estado actual                             │
│       ├── NO requiere login                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SEGURIDAD:
- Token NUNCA se guarda en BD (solo hash)
- Expiración configurable (default 24h)
- Se puede revocar desde panel
- Rate limiting recomendado
- No expone datos sensibles (solo mínimo necesario)
```

---

### 8.2 Modelo de Datos

**Tabla `order_tracking_links` (ya definida):**

```sql
order_tracking_links (
  id           uuid PRIMARY KEY,
  business_id  uuid NOT NULL,
  order_id     uuid NOT NULL,

  token_hash   text NOT NULL,            -- SHA-256 del token
  expires_at   timestamptz NOT NULL,     -- Cuándo expira
  is_revoked   boolean DEFAULT false,    -- Si fue revocado

  created_by   uuid,
  created_at   timestamptz DEFAULT now(),

  UNIQUE (order_id, token_hash)
)
```

---

### 8.3 Edge Functions (ya implementadas en instructions.md)

Las Edge Functions `create_tracking_link` y `get_tracking_snapshot` ya están definidas en `supabase/functions/`. Aquí está el resumen:

**`create_tracking_link`:**

- Input: `{ order_id, expires_in_minutes? }`
- Valida que el usuario es member del business
- Genera token de 32 caracteres
- Guarda hash SHA-256
- Retorna token raw (solo una vez)

**`get_tracking_snapshot`:**

- Input: `?token=...` (query param, público)
- Hashea token y busca en BD
- Valida expiración y revocación
- Retorna snapshot del pedido + ubicación

---

### 8.4 API Route: Crear Link de Tracking

**Archivo: `app/api/tracking/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";

// POST /api/tracking - Crear link de tracking
export async function POST(request: NextRequest) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();

    const { order_id, expires_in_hours = 24 } = await request.json();

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el pedido existe y es del negocio
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, code, business_id")
      .eq("id", order_id)
      .eq("business_id", businessMember.business_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Llamar a Edge Function
    const { data, error } = await supabase.functions.invoke(
      "create_tracking_link",
      {
        body: {
          order_id,
          expires_in_minutes: expires_in_hours * 60,
        },
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Construir URL completa
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/track/${data.token}`;

    return NextResponse.json({
      tracking_url: trackingUrl,
      token: data.token,
      expires_at: data.expires_at,
      order_code: order.code,
    });
  } catch (error: any) {
    console.error("POST /api/tracking error:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear link de tracking" },
      { status: 500 }
    );
  }
}
```

---

### 8.5 Página Pública de Tracking

**Archivo: `app/(public)/track/[token]/page.tsx`**

```typescript
// app/(public)/track/[token]/page.tsx
import { TrackingPageClient } from "./TrackingPageClient";

type Props = {
  params: { token: string };
};

export default function TrackingPage({ params }: Props) {
  return <TrackingPageClient token={params.token} />;
}

// Metadata
export async function generateMetadata({ params }: Props) {
  return {
    title: "Seguimiento de Pedido | Follow It",
    description: "Sigue tu pedido en tiempo real",
  };
}
```

**Archivo: `app/(public)/track/[token]/TrackingPageClient.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type TrackingSnapshot = {
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
    accuracy_m?: number;
  } | null;
};

type Props = {
  token: string;
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof Package;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  assigned: {
    label: "Asignado",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  en_route: {
    label: "En Camino",
    icon: Truck,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  failed: {
    label: "No Entregado",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  canceled: {
    label: "Cancelado",
    icon: AlertCircle,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
  },
};

export function TrackingPageClient({ token }: Props) {
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get_tracking_snapshot?token=${token}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener tracking");
      }

      setSnapshot(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch inicial
  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // Polling cada 15 segundos
  useEffect(() => {
    const interval = setInterval(fetchSnapshot, 15000);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "El link de seguimiento no es válido o ha expirado."}
          </p>
        </div>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[snapshot.order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Seguimiento de Pedido
              </h1>
              {snapshot.order.code && (
                <p className="text-sm text-gray-500 font-mono">
                  {snapshot.order.code}
                </p>
              )}
            </div>
            <button
              onClick={fetchSnapshot}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
            >
              <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Estado actual</p>
              <p className={`text-xl font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </p>
            </div>
          </div>

          {/* Timeline visual */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {["pending", "assigned", "en_route", "delivered"].map(
                (step, index, arr) => {
                  const stepConfig = STATUS_CONFIG[step];
                  const StepIcon = stepConfig.icon;
                  const isActive = arr
                    .slice(0, index + 1)
                    .includes(snapshot.order.status);
                  const isCurrent = step === snapshot.order.status;

                  return (
                    <div
                      key={step}
                      className="flex flex-col items-center relative"
                    >
                      {/* Line */}
                      {index > 0 && (
                        <div
                          className={`absolute right-1/2 top-4 w-full h-0.5 -translate-y-1/2 ${
                            isActive ? "bg-blue-500" : "bg-gray-200"
                          }`}
                          style={{
                            width: "calc(100% - 2rem)",
                            right: "50%",
                            transform: "translateX(50%)",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`
                        relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                        ${
                          isCurrent
                            ? "bg-blue-500 text-white ring-4 ring-blue-100"
                            : isActive
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }
                      `}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>

                      {/* Label */}
                      <span
                        className={`text-xs mt-2 ${
                          isActive ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {stepConfig.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {snapshot.order.dropoff_address && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Dirección de entrega
                </p>
                <p className="text-gray-900">
                  {snapshot.order.dropoff_address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Map (si hay ubicación del mensajero y está en camino) */}
        {snapshot.courier && snapshot.order.status === "en_route" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <p className="text-sm text-gray-500">Ubicación del mensajero</p>
              <p className="text-xs text-gray-400 mt-1">
                Actualizado{" "}
                {formatDistanceToNow(new Date(snapshot.courier.recorded_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
            {/* Placeholder para mapa - integrar con Mapbox/Google Maps */}
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <a
                href={`https://maps.google.com/?q=${snapshot.courier.lat},${snapshot.courier.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                Ver en Google Maps
              </a>
            </div>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-center text-xs text-gray-400">
            Última actualización:{" "}
            {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        Powered by Follow It
      </footer>
    </div>
  );
}
```

---

## 9. Módulo: Offline y Sincronización

### 9.1 Estrategia Offline

```
┌─────────────────────────────────────────────────────────────┐
│                   ESTRATEGIA OFFLINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DATOS QUE SE ALMACENAN LOCALMENTE:                         │
│                                                             │
│  1. Cola de cambios de estado                               │
│     - { order_id, to_status, note, timestamp, client_id }   │
│     - Máximo 20 items                                       │
│     - Se envían en orden FIFO                               │
│                                                             │
│  2. Cola de pings de ubicación                              │
│     - { lat, lng, accuracy, timestamp }                     │
│     - Máximo 50 items                                       │
│     - Se pueden agrupar en batch                            │
│     - Descartar si muy viejos (>1h)                         │
│                                                             │
│  3. Cola de proofs pendientes                               │
│     - { order_id, type, file_blob, lat, lng, timestamp }    │
│     - Máximo 5 items (archivos grandes)                     │
│     - Reintentar con backoff exponencial                    │
│                                                             │
│  SINCRONIZACIÓN:                                            │
│                                                             │
│  ┌─────────────────┐                                        │
│  │ Detectar online │                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐                                    │
│  │ 1. Sync status queue│ (prioridad alta)                   │
│  └────────┬────────────┘                                    │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐                                    │
│  │ 2. Sync proof queue │ (prioridad media)                  │
│  └────────┬────────────┘                                    │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐                                    │
│  │ 3. Sync location q  │ (prioridad baja)                   │
│  └────────┬────────────┘                                    │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐                                    │
│  │ 4. Refresh data     │                                    │
│  └─────────────────────┘                                    │
│                                                             │
│  IDEMPOTENCIA:                                              │
│  - Cada item tiene client_id único                          │
│  - Server detecta duplicados y los ignora                   │
│  - Respuesta indica si fue procesado o ignorado             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 9.2 Hook: useOfflineQueue

**Archivo: `lib/hooks/useOfflineQueue.ts`**

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type QueueItem<T> = {
  id: string; // Client-generated unique ID
  data: T;
  timestamp: number;
  retries: number;
  lastError?: string;
};

type QueueConfig = {
  maxItems: number;
  maxRetries: number;
  retryDelayMs: number;
  maxAgeMs: number;
};

type UseOfflineQueueReturn<T> = {
  queue: QueueItem<T>[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  add: (data: T) => string;
  remove: (id: string) => void;
  clear: () => void;
  sync: () => Promise<void>;
};

const DEFAULT_CONFIG: QueueConfig = {
  maxItems: 20,
  maxRetries: 3,
  retryDelayMs: 5000,
  maxAgeMs: 60 * 60 * 1000, // 1 hora
};

export function useOfflineQueue<T>(
  storageKey: string,
  syncFn: (
    items: QueueItem<T>[]
  ) => Promise<{ succeeded: string[]; failed: string[] }>,
  config: Partial<QueueConfig> = {}
): UseOfflineQueueReturn<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [queue, setQueue] = useState<QueueItem<T>[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const syncingRef = useRef(false);

  // Cargar desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as QueueItem<T>[];
        // Filtrar items viejos
        const now = Date.now();
        const valid = parsed.filter(
          (item) => now - item.timestamp < cfg.maxAgeMs
        );
        setQueue(valid);
      }
    } catch (err) {
      console.error("Error loading offline queue:", err);
    }
  }, [storageKey, cfg.maxAgeMs]);

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    } catch (err) {
      console.error("Error saving offline queue:", err);
    }
  }, [queue, storageKey]);

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Agregar item a la cola
  const add = useCallback(
    (data: T): string => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setQueue((prev) => {
        const newItem: QueueItem<T> = {
          id,
          data,
          timestamp: Date.now(),
          retries: 0,
        };

        const newQueue = [...prev, newItem];

        // Limitar tamaño
        if (newQueue.length > cfg.maxItems) {
          return newQueue.slice(-cfg.maxItems);
        }

        return newQueue;
      });

      return id;
    },
    [cfg.maxItems]
  );

  // Remover item
  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Limpiar cola
  const clear = useCallback(() => {
    setQueue([]);
  }, []);

  // Sincronizar cola
  const sync = useCallback(async () => {
    if (syncingRef.current || queue.length === 0 || !isOnline) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      // Filtrar items que no exceden max retries
      const toSync = queue.filter((item) => item.retries < cfg.maxRetries);

      if (toSync.length === 0) {
        return;
      }

      const result = await syncFn(toSync);

      // Actualizar cola
      setQueue((prev) => {
        return prev
          .filter((item) => !result.succeeded.includes(item.id))
          .map((item) => {
            if (result.failed.includes(item.id)) {
              return { ...item, retries: item.retries + 1 };
            }
            return item;
          });
      });
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [queue, isOnline, cfg.maxRetries, syncFn]);

  // Auto-sync cuando vuelve online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      sync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    queue,
    isOnline,
    isSyncing,
    pendingCount: queue.length,
    add,
    remove,
    clear,
    sync,
  };
}
```

---

### 9.3 Componente: OfflineIndicator

**Archivo: `components/ui/OfflineIndicator.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { WifiOff, Cloud, Loader2 } from "lucide-react";

type Props = {
  pendingCount?: number;
  isSyncing?: boolean;
};

export function OfflineIndicator({
  pendingCount = 0,
  isSyncing = false,
}: Props) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // No mostrar si está online y no hay pendientes
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto
        px-4 py-3 rounded-lg shadow-lg flex items-center gap-3
        ${isOnline ? "bg-blue-500 text-white" : "bg-gray-800 text-white"}
      `}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Sin conexión</span>
          {pendingCount > 0 && (
            <span className="text-sm opacity-80">
              ({pendingCount} pendiente{pendingCount !== 1 ? "s" : ""})
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Sincronizando...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Cloud className="w-5 h-5" />
          <span className="font-medium">
            {pendingCount} cambio{pendingCount !== 1 ? "s" : ""} pendiente
            {pendingCount !== 1 ? "s" : ""}
          </span>
        </>
      ) : null}
    </div>
  );
}
```

---

## 10. Realtime: Suscripciones por Rol

### 10.1 Mapa de Suscripciones

```
┌─────────────────────────────────────────────────────────────┐
│              SUSCRIPCIONES REALTIME POR ROL                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PANEL NEGOCIO                                              │
│  ━━━━━━━━━━━━━━                                             │
│  Tabla: orders                                              │
│  Filter: business_id = <current>                            │
│  Events: INSERT, UPDATE, DELETE                             │
│  Uso: Actualizar tablero de pedidos                         │
│                                                             │
│  Tabla: order_events                                        │
│  Filter: business_id = <current>                            │
│  Events: INSERT                                             │
│  Uso: Timeline en tiempo real                               │
│                                                             │
│  Tabla: courier_locations                                   │
│  Filter: business_id = <current>                            │
│  Events: INSERT                                             │
│  Uso: Mapa de mensajeros                                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  APP MENSAJERO                                              │
│  ━━━━━━━━━━━━━━                                             │
│  Tabla: orders                                              │
│  Filter: assigned_courier_id = <myCourierId>                │
│  Events: INSERT, UPDATE                                     │
│  Uso: Nuevas asignaciones, cambios de estado                │
│                                                             │
│  Tabla: order_events                                        │
│  Filter: courier_id = <myCourierId>                         │
│  Events: INSERT                                             │
│  Uso: Notificaciones de asignación (Realtime)              │
│                                                             │
│  NOTIFICACIONES:                                            │
│  └─> Hook: useCourierNotifications                          │
│  └─> Provider: CourierNotificationProvider                  │
│  └─> Componente: OrderAssignmentToast                       │
│  └─> Método: Supabase Realtime (GRATIS)                     │
│  └─> Funciona: Mientras la app esté abierta                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  TRACKING PÚBLICO                                           │
│  ━━━━━━━━━━━━━━━━                                           │
│  NO USA REALTIME (sin auth)                                 │
│  Usa: Polling cada 10-15s a get_tracking_snapshot           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 10.2 Hook: useRealtimeOrders (Panel)

**Archivo: `lib/hooks/useRealtimeOrders.ts`**

```typescript
"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Order } from "@/types/orders";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

type UseRealtimeOrdersProps = {
  businessId: string;
  onInsert?: (order: Order) => void;
  onUpdate?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  enabled?: boolean;
};

export function useRealtimeOrders({
  businessId,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOrdersProps) {
  const channelRef = useRef<ReturnType<typeof createClient>["channel"] | null>(
    null
  );

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Order>) => {
      const event = payload.eventType as RealtimeEvent;

      switch (event) {
        case "INSERT":
          onInsert?.(payload.new as Order);
          break;
        case "UPDATE":
          onUpdate?.(payload.new as Order);
          break;
        case "DELETE":
          onDelete?.(payload.old as Order);
          break;
      }
    },
    [onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled || !businessId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`orders-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        handleChange
      )
      .subscribe((status) => {
        console.log("Orders realtime status:", status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, enabled, handleChange]);

  // Función para desuscribirse manualmente
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}
```

---

### 10.3 Hook: useRealtimeOrderEvents

**Archivo: `lib/hooks/useRealtimeOrderEvents.ts`**

```typescript
"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type OrderEvent = {
  id: string;
  business_id: string;
  order_id: string;
  type: string;
  from_status: string | null;
  to_status: string | null;
  courier_id: string | null;
  note: string | null;
  meta: Record<string, any>;
  created_by: string | null;
  created_at: string;
};

type UseRealtimeOrderEventsProps = {
  businessId?: string;
  orderId?: string;
  courierId?: string;
  onEvent: (event: OrderEvent) => void;
  enabled?: boolean;
};

export function useRealtimeOrderEvents({
  businessId,
  orderId,
  courierId,
  onEvent,
  enabled = true,
}: UseRealtimeOrderEventsProps) {
  const handleEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<OrderEvent>) => {
      if (payload.eventType === "INSERT") {
        onEvent(payload.new as OrderEvent);
      }
    },
    [onEvent]
  );

  useEffect(() => {
    if (!enabled) return;

    // Necesitamos al menos un filtro
    if (!businessId && !orderId && !courierId) return;

    const supabase = createClient();

    // Construir filtro
    let filter = "";
    if (businessId) filter = `business_id=eq.${businessId}`;
    else if (orderId) filter = `order_id=eq.${orderId}`;
    else if (courierId) filter = `courier_id=eq.${courierId}`;

    const channelName = `events-${businessId || orderId || courierId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_events",
          filter,
        },
        handleEvent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, orderId, courierId, enabled, handleEvent]);
}
```

---

### 10.4 Hook: useCourierNotifications ✅ IMPLEMENTADO

**Archivo: `lib/hooks/useCourierNotifications.ts`**

Hook para que los mensajeros reciban notificaciones cuando se les asigna un pedido. Usa **Supabase Realtime (GRATIS)** - funciona mientras la app esté abierta.

```typescript
"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";

interface Order {
  id: string;
  code: string | null;
  status: string;
  assigned_courier_id: string | null;
  dropoff_address: string;
}

interface UseCourierNotificationsOptions {
  courierId: string;
  onNewAssignment?: (order: Order) => void;
  enabled?: boolean;
}

/**
 * Hook para que los mensajeros reciban notificaciones cuando se les asigna un pedido.
 * Usa Supabase Realtime (gratis) - funciona mientras la app esté abierta.
 */
export function useCourierNotifications({
  courierId,
  onNewAssignment,
  enabled = true,
}: UseCourierNotificationsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !courierId) return;

    const supabase = createClient();

    // Escuchar cambios en pedidos que se asignan a este mensajero
    const channel = supabase
      .channel(`courier-notifications-${courierId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `assigned_courier_id=eq.${courierId}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          const order = payload.new as Order;
          const oldOrder = payload.old as Order;

          // Solo notificar si el pedido cambió a "assigned" y antes no estaba asignado
          if (
            order.status === "assigned" &&
            order.assigned_courier_id === courierId &&
            oldOrder.assigned_courier_id !== courierId
          ) {
            onNewAssignment?.(order);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_events",
          filter: `courier_id=eq.${courierId}`,
        },
        (payload: RealtimePostgresChangesPayload<OrderEvent>) => {
          // Notificar cuando se crea un evento de asignación
          const event = payload.new as OrderEvent;
          if (
            event &&
            "type" in event &&
            event.type === "order_assigned" &&
            event.courier_id === courierId
          ) {
            // Obtener el pedido para mostrar detalles
            supabase
              .from("orders")
              .select("id, code, status, dropoff_address")
              .eq("id", event.order_id)
              .single()
              .then(({ data: order }) => {
                if (order) {
                  onNewAssignment?.(order as Order);
                }
              });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courierId, enabled, onNewAssignment]);

  return {
    unsubscribe: () => {
      /* cleanup */
    },
  };
}
```

**Uso con Provider (Recomendado):**

```typescript
// En la app del mensajero
import { CourierNotificationProvider } from "@/components/notifications/CourierNotificationProvider";

<CourierNotificationProvider courierId={courierId}>
  {/* Tu app aquí */}
</CourierNotificationProvider>;
```

**Componentes relacionados:**

- `components/notifications/CourierNotificationProvider.tsx` - Provider que maneja todo automáticamente
- `components/notifications/OrderAssignmentToast.tsx` - Toast visual cuando llega un pedido

**Ventajas:**

- ✅ 100% Gratis (Supabase Realtime incluido)
- ✅ Tiempo real instantáneo
- ✅ Sin configuración adicional
- ✅ Funciona en web y móvil

**Limitación:**

- Solo funciona mientras la app esté abierta (no es push nativo del sistema)

**Documentación completa:** Ver `docs/NOTIFICATIONS_REALTIME.md`

---

### 10.5 Mejoras Futuras del Sistema de Notificaciones

#### 🎯 Prioridad Alta

**1. Notificaciones para Mensajeros (Extender `useCourierNotifications`)**

- ✅ **Implementado:** Notificación cuando se asigna un pedido
- ⏳ **Pendiente:** Notificación cuando se desasigna un pedido (`assigned → pending`)
- ⏳ **Pendiente:** Notificación cuando se cancela un pedido asignado
- ⏳ **Pendiente:** Notificación cuando se reasigna un pedido (cambio de mensajero)

**Implementación sugerida:**

```typescript
// Extender useCourierNotifications para incluir:
interface UseCourierNotificationsOptions {
  courierId: string;
  onNewAssignment?: (order: Order) => void;
  onUnassignment?: (order: Order) => void; // Nuevo
  onCancellation?: (order: Order) => void; // Nuevo
  onReassignment?: (order: Order) => void; // Nuevo
  enabled?: boolean;
}
```

**Eventos a escuchar:**

- `order_events` con `type: "order_unassigned"` y `courier_id = courierId`
- `order_events` con `type: "order_canceled"` y pedido tenía `assigned_courier_id = courierId`
- `orders` UPDATE donde `assigned_courier_id` cambia de `courierId` a otro valor

**2. Notificaciones para el Negocio (`useBusinessNotifications`)**

Crear nuevo hook para que el negocio reciba notificaciones cuando:

- ⏳ Mensajero marca pedido como "en_route"
- ⏳ Mensajero marca pedido como "delivered"
- ⏳ Mensajero marca pedido como "failed"
- ⏳ Se sube un comprobante de entrega (`order_proofs` INSERT)

**Implementación sugerida:**

```typescript
// lib/hooks/useBusinessNotifications.ts
interface UseBusinessNotificationsOptions {
  businessId: string;
  onStatusChange?: (order: Order, fromStatus: string, toStatus: string) => void;
  onProofUploaded?: (proof: Proof, order: Order) => void;
  enabled?: boolean;
}

export function useBusinessNotifications({
  businessId,
  onStatusChange,
  onProofUploaded,
  enabled = true,
}: UseBusinessNotificationsOptions) {
  // Escuchar order_events donde business_id = businessId
  // Escuchar order_proofs donde business_id = businessId
  // Filtrar solo eventos importantes (en_route, delivered, failed)
}
```

**Eventos a escuchar:**

- `order_events` con `business_id = businessId` y `type: "status_changed"`
- `order_events` con `business_id = businessId` y `to_status IN ('en_route', 'delivered', 'failed')`
- `order_proofs` INSERT donde `business_id = businessId`

#### 🎯 Prioridad Media

**3. Notificaciones de Proximidad (GPS)**

- Notificar al cliente cuando el mensajero está cerca del destino (ej: < 500m)
- Requiere cálculo de distancia en tiempo real usando `courier_locations`

**Implementación sugerida:**

```typescript
// lib/hooks/useProximityNotification.ts
// Calcular distancia entre última ubicación del mensajero y dropoff_address
// Notificar cuando distancia < umbral (ej: 500m)
```

**4. Notificaciones para Cliente (Tracking Público)**

- Notificar al cliente cuando el pedido cambia de estado
- Desafío: cliente no tiene sesión, solo token de tracking
- Opciones:
  - Polling cada 10-15s (ya implementado en `get_tracking_snapshot`)
  - WebSocket con token efímero (más complejo)
  - Email/SMS cuando cambia estado (requiere servicio externo)

#### 📋 Checklist de Implementación

**Fase 1: Notificaciones Mensajero (Extender)**

- [ ] Agregar `onUnassignment` callback a `useCourierNotifications`
- [ ] Escuchar eventos `order_unassigned` donde `courier_id = courierId`
- [ ] Escuchar eventos `order_canceled` para pedidos asignados
- [ ] Crear componente `OrderUnassignmentToast`
- [ ] Actualizar `CourierNotificationProvider` para manejar múltiples tipos

**Fase 2: Notificaciones Negocio (Nuevo)**

- [ ] Crear `lib/hooks/useBusinessNotifications.ts`
- [ ] Escuchar `order_events` con filtros de negocio
- [ ] Escuchar `order_proofs` INSERT
- [ ] Crear componente `BusinessNotificationToast`
- [ ] Crear `BusinessNotificationProvider`
- [ ] Integrar en dashboard del negocio

**Fase 3: Notificaciones Proximidad (Opcional)**

- [ ] Crear hook `useProximityNotification`
- [ ] Calcular distancia en tiempo real
- [ ] Notificar cuando < umbral
- [ ] Integrar con tracking público

**Fase 4: Notificaciones Cliente (Opcional)**

- [ ] Evaluar necesidad real vs polling actual
- [ ] Si necesario: implementar WebSocket con token efímero
- [ ] O: integrar servicio de email/SMS para cambios críticos

#### 💡 Notas de Implementación

- **Todas las notificaciones usan Supabase Realtime (gratis)**
- **Funcionan solo mientras la app esté abierta**
- **Para notificaciones con app cerrada:** requeriría push nativas (FCM/APNS) o servicios externos (WhatsApp/SMS)
- **Priorizar notificaciones críticas:** asignación, entrega, fallos
- **Evitar spam:** no notificar cada cambio menor, solo eventos importantes

---

## 11. Componentes UI Reutilizables

### 11.1 Componentes Base Adicionales

**Archivo: `components/ui/Modal.tsx`**

```typescript
"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
};

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: Props) {
  // Cerrar con Escape
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${SIZES[size]} bg-white rounded-xl shadow-xl`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
```

**Archivo: `components/ui/EmptyState.tsx`**

```typescript
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
```

**Archivo: `components/ui/Skeleton.tsx`**

```typescript
type Props = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
};

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: Props) {
  const baseClasses = "animate-pulse bg-gray-200";

  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Preset skeletons
export function OrderCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={100} />
        <Skeleton width={80} height={24} variant="rectangular" />
      </div>
      <Skeleton className="mb-2" />
      <Skeleton width="60%" className="mb-3" />
      <div className="flex items-center justify-between pt-3 border-t">
        <Skeleton width={120} />
        <Skeleton width={60} />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

## 12. Hooks Personalizados (Resumen)

```typescript
// Listado de todos los hooks a implementar

// ━━━ Autenticación (ya existen) ━━━
useUser(); // Usuario actual + loading
useUserRole(); // Rol del usuario (business/courier)

// ━━━ Pedidos ━━━
useOrders(filters); // Lista de pedidos con filtros y paginación
useOrder(id); // Pedido individual con relaciones
useOrderEvents(id); // Timeline de eventos del pedido
useOrderProofs(id); // Comprobantes del pedido

// ━━━ Mensajeros ━━━
useCouriers(businessId); // Lista de mensajeros
useCourierLocation(courierId); // Última ubicación

// ━━━ Tracking GPS ━━━
useLocationTracking(hasActiveOrders); // Tracking del mensajero
useRealtimeLocations(businessId); // Mapa en tiempo real

// ━━━ Proofs ━━━
useProofCapture(); // Capturar y subir comprobantes

// ━━━ Offline ━━━
useOfflineQueue(key, syncFn, config); // Cola offline genérica

// ━━━ Realtime ━━━
useRealtimeOrders(businessId); // Suscripción a pedidos
useRealtimeOrderEvents(filter); // Suscripción a eventos
```

---

## 13. Validaciones (Resumen de Schemas Zod)

```typescript
// Archivo: lib/validations/index.ts
// Re-exportar todos los schemas

export * from "./order";
export * from "./proof";
export * from "./location";

// ━━━ order.ts ━━━
createOrderSchema; // Crear pedido
updateOrderSchema; // Actualizar pedido
assignOrderSchema; // Asignar mensajero
changeStatusSchema; // Cambiar estado
orderFiltersSchema; // Filtros de búsqueda

// ━━━ proof.ts ━━━
proofUploadSchema; // Solicitar URL de subida
proofConfirmSchema; // Confirmar subida

// ━━━ location.ts ━━━
locationPingSchema; // Ping individual
locationBatchSchema; // Batch de pings
```

---

## 14. Edge Functions (Resumen)

Las Edge Functions ya están definidas en `supabase/functions/`. Aquí el resumen:

```
supabase/functions/
├── _shared/
│   ├── supabase.ts      # Clientes admin y user
│   ├── http.ts          # Helpers de respuesta
│   └── crypto.ts        # Hash SHA-256
│
├── assign_order/
│   └── index.ts         # Asignar pedido a mensajero
│
├── change_order_status/
│   └── index.ts         # Cambiar estado (con validaciones)
│
├── create_proof_upload/
│   └── index.ts         # Generar signed URL para subir proof
│
├── create_tracking_link/
│   └── index.ts         # Crear link de tracking público
│
└── get_tracking_snapshot/
    └── index.ts         # Obtener snapshot para cliente (público)
```

**Cuando usar Edge Functions vs API Routes:**

| Operación        | Edge Function            | API Route |
| ---------------- | ------------------------ | --------- |
| Cambio de estado | ✓ (validación crítica)   | Wrapper   |
| Asignar pedido   | ✓ (reglas de negocio)    | Wrapper   |
| Subir proof      | ✓ (signed URL)           | Wrapper   |
| Tracking público | ✓ (sin auth, rate limit) | -         |
| CRUD básico      | -                        | ✓         |
| Listados con RLS | -                        | ✓         |

---

## Resumen de Implementación

### Orden sugerido de desarrollo:

1. **Fase 1: Core Orders (1-2 semanas)** ✅ COMPLETADO

   - [x] Tipos y validaciones
   - [x] API Routes CRUD
   - [x] Hook useOrders
   - [x] Componentes: OrderCard, OrderStatusBadge, OrderFilters
   - [x] Página lista de pedidos
   - [x] Formulario crear pedido
   - [x] Modal de detalles y edición
   - [x] Optimización móvil (responsive, touch-friendly)

2. **Fase 2: Asignación (3-5 días)** ✅ COMPLETADO

   - [x] CourierSelect component
   - [x] AssignOrderModal
   - [x] API Route asignar/desasignar
   - [x] Integración con lista de pedidos
   - [x] Hook useCouriers
   - [x] Notificaciones Realtime para mensajeros (useCourierNotifications)
   - [x] CourierNotificationProvider y OrderAssignmentToast

3. **Fase 3: Transiciones (3-5 días)**

   - [x] OrderActions component (mensajero)
   - [x] API Route cambiar estado
   - [x] Integración en OrderDetailModal para mensajeros
   - [x] Timeline de eventos

4. **Fase 4: Proofs (1 semana)** ✅ COMPLETADO

   - [x] ProofCapture component
   - [x] Hook useProofCapture
   - [x] API Routes upload/confirm
   - [x] API Route GET /api/orders/[id]/proofs (con autorización corregida)
   - [x] ProofGallery, ProofViewer

5. **Fase 5: Notificaciones (Completado)** ✅ COMPLETADO

   - [x] Hook useCourierNotifications (Supabase Realtime)
   - [x] CourierNotificationProvider
   - [x] OrderAssignmentToast component
   - [x] Integración con asignación de pedidos
   - [x] Documentación en docs/NOTIFICATIONS_REALTIME.md

   **Mejoras Futuras (Ver Sección 10.5):**

   - [ ] Notificaciones de desasignación/cancelación para mensajeros
   - [ ] Hook useBusinessNotifications para el negocio
   - [ ] Notificaciones cuando se sube comprobante
   - [ ] Notificaciones de proximidad GPS (opcional)

6. **Fase 6: Tracking GPS (1 semana)**

   - [ ] Hook useLocationTracking
   - [ ] API Route locations
   - [ ] Hook useRealtimeLocations
   - [ ] Mapa en dashboard

7. **Fase 6: Tracking Público (3-5 días)**

   - [x] Página /track/[token]
   - [x] API Route crear link
   - [x] UI de tracking cliente
   - [x] Timeline de eventos en tracking público
   - [x] Estados completados coloreados en timeline visual

8. **Fase 7: Offline y Polish (1 semana)**
   - [ ] Hook useOfflineQueue
   - [ ] OfflineIndicator
   - [ ] Realtime subscriptions
   - [ ] Testing y bug fixes

---

**Total estimado: 5-7 semanas** para un MVP funcional completo.
