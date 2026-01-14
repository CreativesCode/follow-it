# Follow It - Sistema de Gestión de Repartos

Sistema completo de gestión de repartos (delivery management) construido con Next.js, Capacitor y Supabase.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Mobile**: Capacitor (Android/iOS)
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Arquitectura**: SPA con roles (Admin/Negocio, Mensajero, Cliente)

## 📋 Características

### ✅ Implementado

- **Sistema de Autenticación Completo**

  - Email/Password con validación segura
  - Magic Links (login sin contraseña)
  - Recuperación y cambio de contraseña
  - Verificación de email
  - OAuth (Google/GitHub) preparado
  - Onboarding por roles (Negocio/Mensajero)
  - Protección de rutas con middleware
  - Session management con HTTP-only cookies

- **Sistema de Invitaciones de Mensajeros**

  - Generación de códigos únicos de invitación
  - Creación de invitaciones desde el dashboard
  - Validación de códigos antes de aceptar
  - Aceptación automática de invitaciones
  - Gestión de invitaciones (ver estado, listar)
  - Prevención de duplicados
  - Expiración automática (7 días)

- **Infraestructura Base**
  - Multi-tenant con Row Level Security (RLS)
  - Esquema de base de datos completo
  - Edge Functions preparadas
  - Componentes UI reutilizables
  - Landing page y Dashboard básico
  - Página de gestión de mensajeros (`/dashboard/couriers`)

### 🚧 En Desarrollo

- Gestión de pedidos con estados (pending, assigned, en_route, delivered, failed, canceled)
- Asignación de mensajeros
- Tracking GPS en tiempo real
- Comprobantes de entrega (foto/firma)
- Links de tracking público para clientes
- Event sourcing ligero (timeline de eventos)
- Realtime updates (pedidos, ubicaciones, eventos)

## 🏗️ Estructura del Proyecto

```
follow-it/
├── app/                       # Next.js App Router
│   ├── auth/                  # Sistema de autenticación
│   │   ├── login/             # Inicio de sesión
│   │   ├── register/          # Registro
│   │   ├── forgot-password/   # Recuperación
│   │   ├── reset-password/    # Cambio de contraseña
│   │   ├── verify-email/      # Verificación
│   │   ├── callback/          # OAuth callback
│   │   └── onboarding/        # Configuración inicial
│   ├── dashboard/             # Panel principal (protegido)
│   └── page.tsx               # Landing page
├── components/
│   └── ui/                    # Componentes reutilizables
│       ├── Button.tsx
│       ├── FormInput.tsx
│       ├── AuthCard.tsx
│       └── Alert.tsx
├── lib/
│   ├── auth/                  # Autenticación
│   │   └── actions.ts         # Server Actions
│   ├── hooks/                 # React Hooks
│   │   ├── useUser.ts
│   │   └── useUserRole.ts
│   ├── utils/
│   │   └── auth.ts            # Utilidades auth
│   └── supabase/              # Clientes Supabase
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── types/                     # TypeScript types
│   ├── database.ts
│   └── index.ts
├── supabase/
│   ├── functions/             # Edge Functions
│   │   ├── _shared/
│   │   ├── change_order_status/
│   │   ├── assign_order/
│   │   ├── get_tracking_snapshot/
│   │   ├── create_tracking_link/
│   │   └── create_proof_upload/
│   └── migrations/            # Migraciones SQL
├── docs/                      # Documentación
│   ├── instructions.md        # Especificaciones completas
│   ├── AUTH_SETUP.md          # Setup de autenticación
│   └── QUICK_START.md         # Inicio rápido
└── middleware.ts              # Protección de rutas
```

## 🚦 Inicio Rápido

### 1. Instalación

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com) (gratis)
2. Ve a **SQL Editor** y ejecuta: `supabase/migrations/apply_all.sql`
3. Ve a **Settings** > **API** y copia tus credenciales

### 3. Variables de Entorno

Crea `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configurar Email (Opcional para desarrollo)

En Supabase Dashboard:

- Ve a **Authentication** > **Settings**
- Desactiva **Enable email confirmations** (solo para testing)

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

### 6. Probar el Sistema

1. Haz clic en "Comenzar Gratis"
2. Regístrate con un email
3. Completa el onboarding
4. ¡Listo! Ya tienes acceso al dashboard

📚 **Ver guía completa**: [`docs/QUICK_START.md`](docs/QUICK_START.md)

## 📝 Proceso de Registro

### Registro como Negocio

1. **Crear Cuenta:**

   - Ve a la página principal (`/`)
   - Haz clic en "Comenzar Gratis" o "Registrarse"
   - Completa el formulario:
     - Email
     - Contraseña (mínimo 8 caracteres, con mayúscula, minúscula y número)
     - Confirmar contraseña
   - Haz clic en "Crear Cuenta"

2. **Verificación de Email (si está habilitada):**

   - Revisa tu bandeja de entrada
   - Haz clic en el enlace de verificación
   - Serás redirigido automáticamente al onboarding

3. **Onboarding:**

   - Selecciona "Soy un Negocio"
   - Completa la información:
     - **Nombre del Negocio**: Nombre de tu empresa
     - **Zona Horaria**: Selecciona tu zona horaria (por defecto: Cuba GMT-5)
   - Haz clic en "Completar Configuración"

4. **Acceso al Dashboard:**
   - Serás redirigido automáticamente al dashboard
   - Ya puedes comenzar a gestionar tu negocio

### Registro como Mensajero

Los mensajeros deben ser invitados por un negocio para poder registrarse.

#### Paso 1: Obtener Código de Invitación

1. **Desde el Negocio:**
   - El negocio debe ir a `/dashboard/couriers`
   - Hacer clic en "Invitar Mensajero"
   - Opcionalmente ingresar nombre y email del mensajero
   - Generar código de invitación
   - Compartir el código con el mensajero

#### Paso 2: Registrarse como Mensajero

1. **Crear Cuenta:**

   - Ve a la página principal (`/`)
   - Haz clic en "Comenzar Gratis" o "Registrarse"
   - Completa el formulario:
     - Email (preferiblemente el mismo que el negocio tiene registrado)
     - Contraseña (mínimo 8 caracteres)
     - Confirmar contraseña
   - Haz clic en "Crear Cuenta"

2. **Verificación de Email (si está habilitada):**

   - Revisa tu bandeja de entrada
   - Haz clic en el enlace de verificación

3. **Onboarding con Código de Invitación:**

   - Selecciona "Soy un Mensajero"
   - Ingresa el **Código de Invitación** que recibiste del negocio
   - Haz clic en "Validar Código"
   - Verás la información del negocio al que te estás uniendo:
     - Nombre del negocio
     - Tu nombre (si fue proporcionado)
     - Tu email (si fue proporcionado)
   - Haz clic en "Aceptar Invitación y Continuar"

4. **Acceso al Dashboard:**
   - Serás redirigido automáticamente al dashboard
   - Ya puedes comenzar a recibir asignaciones de pedidos

### Iniciar Sesión (Usuarios Existentes)

1. Ve a `/auth/login`
2. Ingresa tu email y contraseña
3. Haz clic en "Iniciar Sesión"
4. Serás redirigido al dashboard según tu rol

### Recuperar Contraseña

1. Ve a `/auth/login`
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Revisa tu bandeja de entrada para el enlace de recuperación
5. Sigue las instrucciones para crear una nueva contraseña

### Magic Links (Login sin Contraseña)

1. Ve a `/auth/login`
2. Haz clic en "Enviar enlace mágico"
3. Ingresa tu email
4. Revisa tu bandeja de entrada
5. Haz clic en el enlace para iniciar sesión automáticamente

## 🔐 Roles y Permisos

### Negocio (Business Owner/Admin)

- ✅ Crear y gestionar pedidos
- ✅ Invitar mensajeros mediante códigos
- ✅ Asignar pedidos a mensajeros
- ✅ Ver dashboard con estadísticas
- ✅ Gestionar mensajeros (ver lista, estado)
- ✅ Ver invitaciones creadas

### Mensajero (Courier)

- ✅ Ver pedidos asignados
- ✅ Cambiar estado de pedidos (en camino, entregado, fallido)
- ✅ Subir comprobantes de entrega (próximamente)
- ✅ Enviar ubicación GPS (próximamente)
- ✅ Ver información del negocio al que pertenece

### Cliente (Público)

- ✅ Ver tracking de pedido mediante link (próximamente)
- ❌ No requiere registro ni login

## 📚 Documentación

### 🎯 Documentos Principales

- **[Quick Start](docs/QUICK_START.md)** - Configuración en 5 minutos
- **[Auth Setup](docs/AUTH_SETUP.md)** - Guía completa de autenticación
- **[Instructions](docs/instructions.md)** - Especificaciones técnicas completas

### 🔐 Sistema de Autenticación

El sistema incluye:

- ✅ Email/Password con validación segura
- ✅ Magic Links (login sin contraseña)
- ✅ Recuperación de contraseña
- ✅ Verificación de email
- ✅ OAuth (Google/GitHub) preparado
- ✅ Protección de rutas automática
- ✅ Session management seguro

Ver [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md) para configuración avanzada.

### 🏗️ Recursos Adicionales

- **[supabase/migrations/README.md](supabase/migrations/README.md)** - Documentación de migraciones
- **[supabase/functions/README.md](supabase/functions/README.md)** - Documentación de Edge Functions

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Capacitor (móvil)
npm run cap:sync         # Sincronizar con plataformas nativas
npm run cap:android      # Abrir proyecto Android
npm run cap:ios          # Abrir proyecto iOS

# Supabase
npm run supabase:start   # Iniciar Supabase local
npm run supabase:stop    # Detener Supabase local
npm run supabase:db:reset # Resetear BD local
```

## 🎯 Roles del Sistema

### Admin/Negocio

- Crear y gestionar pedidos
- Asignar mensajeros
- Ver tablero de pedidos
- Ver mapa con ubicaciones en tiempo real
- Revisar comprobantes de entrega
- Generar links de tracking

### Mensajero

- Ver pedidos asignados
- Cambiar estado de pedidos
- Subir comprobantes (foto/firma)
- Enviar ubicación GPS

### Cliente

- Ver tracking de pedido (sin login)
- Ver ubicación del mensajero en tiempo real

## 🔐 Seguridad

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Multi-tenant seguro (cada negocio solo ve sus datos)
- ✅ Validación de transiciones de estado
- ✅ Tokens hash para tracking público
- ✅ Autenticación JWT en Edge Functions

## 📦 Próximos Pasos

- [ ] Implementar UI completa del panel de negocio
- [ ] Implementar UI de la app mensajero
- [ ] Implementar página de tracking público
- [ ] Agregar notificaciones push
- [ ] Implementar modo offline
- [ ] Agregar optimización de rutas
- [ ] Envío automático de emails con códigos de invitación
- [ ] Gestión avanzada de mensajeros (activar/desactivar)

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribuir

Este es un proyecto privado. Para contribuciones, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para gestión eficiente de repartos**
