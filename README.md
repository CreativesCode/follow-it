# Follow It - Sistema de Gestión de Repartos

Sistema completo de gestión de repartos (delivery management) construido con Next.js, Capacitor y Supabase.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Mobile**: Capacitor (Android/iOS)
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Arquitectura**: SPA con roles (Admin/Negocio, Mensajero, Cliente)

## 📋 Características

- ✅ Gestión de pedidos con estados (pending, assigned, en_route, delivered, failed, canceled)
- ✅ Asignación de mensajeros
- ✅ Tracking GPS en tiempo real
- ✅ Comprobantes de entrega (foto/firma)
- ✅ Links de tracking público para clientes
- ✅ Multi-tenant con Row Level Security (RLS)
- ✅ Event sourcing ligero (timeline de eventos)
- ✅ Realtime updates (pedidos, ubicaciones, eventos)

## 🏗️ Estructura del Proyecto

```
follow-it/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Rutas del panel de negocio
│   ├── (courier)/        # Rutas de la app mensajero
│   └── (public)/         # Rutas públicas (tracking)
├── components/            # Componentes React
├── lib/
│   └── supabase/         # Clientes de Supabase
│       ├── client.ts      # Cliente para componentes del cliente
│       ├── server.ts      # Cliente para Server Components
│       └── middleware.ts  # Cliente para middleware
├── hooks/                 # Custom React hooks
├── types/                 # Tipos TypeScript
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── _shared/       # Código compartido
│   │   ├── change_order_status/
│   │   ├── assign_order/
│   │   ├── get_tracking_snapshot/
│   │   ├── create_tracking_link/
│   │   └── create_proof_upload/
│   └── migrations/        # Migraciones de BD
├── docs/                  # Documentación
└── middleware.ts          # Middleware de Next.js
```

## 🚦 Inicio Rápido

### 1. Instalación

```bash
# Clonar repositorio (si aplica)
git clone <repo-url>
cd follow-it

# Instalar dependencias
npm install
```

### 2. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar credenciales a `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

### 3. Configurar Base de Datos

```bash
# Opción A: Usar migraciones (recomendado)
npx supabase db push

# Opción B: Ejecutar SQL manualmente
# Ver supabase/migrations/apply_all.sql
```

### 4. Crear Storage Bucket

En Supabase Dashboard → Storage:

- Crear bucket `proofs`
- Marcar como **privado**

### 5. Desplegar Edge Functions

```bash
npx supabase functions deploy change_order_status
npx supabase functions deploy get_tracking_snapshot
npx supabase functions deploy assign_order
npx supabase functions deploy create_tracking_link
npx supabase functions deploy create_proof_upload
```

### 6. Ejecutar Proyecto

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

## 📚 Documentación

- **[COMANDOS.md](docs/COMANDOS.md)** - Guía completa de comandos y setup
- **[instructions.md](docs/instructions.md)** - Especificaciones técnicas completas
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

- [ ] Implementar UI del panel de negocio
- [ ] Implementar UI de la app mensajero
- [ ] Implementar página de tracking público
- [ ] Agregar notificaciones push
- [ ] Implementar modo offline
- [ ] Agregar optimización de rutas

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribuir

Este es un proyecto privado. Para contribuciones, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para gestión eficiente de repartos**
