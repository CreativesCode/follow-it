# Plan de Migración a SPA Puro - Listado de Tareas

Este documento contiene el listado completo de tareas organizadas por módulos para migrar la aplicación de Next.js con SSR/SSG a una SPA pura compatible con Capacitor.

**Total de tareas**: 45  
**Referencia**: Ver `ANALISIS_SPA_CAPACITOR.md` para el análisis completo

---

## 📋 Índice

1. [Configuración Base](#1-configuración-base-4-tareas)
2. [Módulo Orders](#2-módulo-orders-8-tareas)
3. [Módulo Couriers](#3-módulo-couriers-4-tareas)
4. [Módulo Locations](#4-módulo-locations-3-tareas)
5. [Módulo Notifications](#5-módulo-notifications-4-tareas)
6. [Módulo Proofs](#6-módulo-proofs-4-tareas)
7. [Módulo Tracking](#7-módulo-tracking-4-tareas)
8. [Limpieza](#8-limpieza-3-tareas)
9. [Testing](#9-testing-8-tareas)
10. [Optimización](#10-optimización-3-tareas)

---

## 1. Configuración Base (4 tareas)

### ✅ Tarea 1.1: Habilitar exportación estática

- **Archivo**: `next.config.ts`
- **Acción**: Descomentar `output: "export"`
- **Descripción**: Habilitar exportación estática en Next.js para generar SPA puro

### ✅ Tarea 1.2: Remover funciones incompatibles

- **Archivo**: `next.config.ts`
- **Acción**: Remover `async headers()` y `generateBuildId()`
- **Descripción**: Estas funciones requieren servidor Node.js y no funcionan en exportación estática

### ✅ Tarea 1.3: Convertir metadata a estática

- **Archivo**: `app/layout.tsx`
- **Acción**: Cambiar `generateMetadata()` async a `metadata` estático
- **Descripción**: La metadata dinámica no funciona en exportación estática

### ✅ Tarea 1.4: Adaptar/remover middleware

- **Archivo**: `middleware.ts`
- **Acción**: Remover o mover lógica a hook de cliente
- **Descripción**: El middleware requiere servidor Node.js. Mover lógica de sesión a `useEffect` en cliente

---

## 2. Módulo Orders (8 tareas)

### ✅ Tarea 2.1: Migrar /api/orders (GET, POST)

- **Archivos**:
  - `app/api/orders/route.ts` → Eliminar
  - `lib/hooks/useOrders.ts` → Actualizar
- **Acción**: Reemplazar llamadas `fetch('/api/orders')` con Supabase directo
- **Descripción**: Usar `supabase.from('orders').select()` y `.insert()`

### ✅ Tarea 2.2: Migrar /api/orders/[id] (GET, PUT, DELETE)

- **Archivos**:
  - `app/api/orders/[id]/route.ts` → Eliminar
  - `lib/hooks/useOrder.ts` → Actualizar
- **Acción**: Reemplazar con Supabase directo usando `.select()`, `.update()`, `.delete()`

### ✅ Tarea 2.3: Migrar /api/orders/[id]/assign

- **Archivos**:
  - `app/api/orders/[id]/assign/route.ts` → Eliminar
  - Componentes que usan asignación → Actualizar
- **Acción**: Usar Supabase directo con RLS y triggers para validaciones
- **Nota**: La lógica de asignación puede usar database triggers en Supabase

### ✅ Tarea 2.4: Migrar /api/orders/[id]/status

- **Archivos**:
  - `app/api/orders/[id]/status/route.ts` → Eliminar
  - Componentes de cambio de estado → Actualizar
- **Acción**: Usar Supabase directo con validación en cliente (Zod)

### ✅ Tarea 2.5: Migrar /api/orders/[id]/events

- **Archivos**:
  - `app/api/orders/[id]/events/route.ts` → Eliminar
  - `lib/hooks/useOrderEvents.ts` → Actualizar
- **Acción**: Usar Supabase Realtime subscriptions directamente desde cliente

### ✅ Tarea 2.6: Migrar generación de código único

- **Archivos**: Database functions en Supabase
- **Acción**: Crear database function o trigger en Supabase para generar códigos únicos
- **Descripción**: Actualmente se genera en API route, mover a nivel de base de datos

### ✅ Tarea 2.7: Actualizar OrderSearchModal

- **Archivo**: `components/navigation/OrderSearchModal.tsx`
- **Acción**: Reemplazar `fetch('/api/orders/${id}')` con Supabase directo

### ✅ Tarea 2.8: Actualizar componentes que usan fetch("/api/orders")

- **Archivos**: Buscar todos los componentes que usan fetch a `/api/orders`
- **Acción**: Reemplazar todas las llamadas con Supabase directo
- **Herramienta**: Usar `grep` para encontrar todas las referencias

---

## 3. Módulo Couriers (4 tareas)

### ✅ Tarea 3.1: Migrar /api/couriers/invite

- **Archivos**:
  - `app/api/couriers/invite/route.ts` → Eliminar
  - Componentes de invitación → Actualizar
- **Acción**: Usar Supabase directo o Edge Function si requiere lógica compleja (emails)

### ✅ Tarea 3.2: Migrar /api/couriers/accept

- **Archivos**:
  - `app/api/couriers/accept/route.ts` → Eliminar
  - Componentes de aceptación → Actualizar
- **Acción**: Usar Supabase directo con RLS para validar permisos

### ✅ Tarea 3.3: Migrar /api/couriers/validate

- **Archivos**:
  - `app/api/couriers/validate/route.ts` → Eliminar
  - Componentes de validación → Actualizar
- **Acción**: Usar Supabase directo con queries simples

### ✅ Tarea 3.4: Actualizar useCouriers

- **Archivo**: `lib/hooks/useCouriers.ts`
- **Acción**: Reemplazar todas las llamadas a API routes con Supabase directo

---

## 4. Módulo Locations (3 tareas)

### ✅ Tarea 4.1: Migrar /api/locations (POST, GET)

- **Archivos**:
  - `app/api/locations/route.ts` → Eliminar
  - `lib/hooks/useLocationTracking.ts` → Actualizar
- **Acción**: Usar Supabase directo para insertar y obtener ubicaciones

### ✅ Tarea 4.2: Actualizar useLocationTracking

- **Archivo**: `lib/hooks/useLocationTracking.ts`
- **Acción**: Reemplazar `fetch('/api/locations')` con Supabase directo
- **Nota**: Asegurar que RLS permite insertar ubicaciones desde cliente

### ✅ Tarea 4.3: Actualizar useRealtimeLocations

- **Archivo**: `lib/hooks/useRealtimeLocations.ts`
- **Acción**: Usar Supabase Realtime subscriptions directamente
- **Descripción**: Ya debería estar usando Realtime, verificar que no hay llamadas a API routes

---

## 5. Módulo Notifications (4 tareas)

### ✅ Tarea 5.1: Migrar /api/notifications (GET, POST)

- **Archivos**:
  - `app/api/notifications/route.ts` → Eliminar
  - `lib/hooks/useNotifications.ts` → Actualizar
- **Acción**: Usar Supabase directo para leer y crear notificaciones

### ✅ Tarea 5.2: Migrar /api/notifications/register

- **Archivos**:
  - `app/api/notifications/register/route.ts` → Eliminar
  - `lib/hooks/usePushNotifications.ts` → Actualizar
- **Acción**: Usar Capacitor Push Notifications API directamente
- **Descripción**: Registrar tokens de push directamente desde cliente con Capacitor

### ✅ Tarea 5.3: Actualizar useNotifications

- **Archivo**: `lib/hooks/useNotifications.ts`
- **Acción**: Reemplazar llamadas a API routes con Supabase directo

### ✅ Tarea 5.4: Actualizar usePushNotifications

- **Archivo**: `lib/hooks/usePushNotifications.ts`
- **Acción**: Integrar con Capacitor Push Notifications API
- **Nota**: Verificar compatibilidad con web (usar service worker si es necesario)

---

## 6. Módulo Proofs (4 tareas)

### ✅ Tarea 6.1: Migrar /api/proofs/upload-url

- **Archivos**:
  - `app/api/proofs/upload-url/route.ts` → Eliminar
  - `lib/hooks/useProofCapture.ts` → Actualizar
- **Acción**: Usar `supabase.storage.from('proofs').createSignedUploadUrl()`
- **Descripción**: Generar signed URLs directamente desde cliente

### ✅ Tarea 6.2: Migrar /api/proofs/[id] (GET, DELETE)

- **Archivos**:
  - `app/api/proofs/[id]/route.ts` → Eliminar
  - Componentes de proofs → Actualizar
- **Acción**: Usar Supabase Storage directo con `.download()` y `.remove()`

### ✅ Tarea 6.3: Migrar /api/proofs/confirm

- **Archivos**:
  - `app/api/proofs/confirm/route.ts` → Eliminar
  - Componentes de confirmación → Actualizar
- **Acción**: Usar Supabase directo con validación en cliente

### ✅ Tarea 6.4: Actualizar useProofCapture

- **Archivo**: `lib/hooks/useProofCapture.ts`
- **Acción**: Reemplazar todas las llamadas a API routes con Supabase Storage directo
- **Nota**: Asegurar que RLS en Storage buckets permite las operaciones necesarias

---

## 7. Módulo Tracking (4 tareas)

### ✅ Tarea 7.1: Migrar /api/tracking (GET)

- **Archivos**:
  - `app/api/tracking/route.ts` → Eliminar
  - `app/track/TrackingPageClient.tsx` → Actualizar
- **Acción**: Usar Supabase directo con RLS público (para tracking público)
- **Nota**: Asegurar que RLS permite lectura pública con token válido

### ✅ Tarea 7.2: Migrar /api/tracking/[token]/events

- **Archivos**:
  - `app/api/tracking/[token]/events/route.ts` → Eliminar
  - Componentes de eventos → Actualizar
- **Acción**: Usar Supabase Realtime subscriptions con RLS público

### ✅ Tarea 7.3: Migrar /api/tracking/[token]/send-whatsapp

- **Archivos**:
  - `app/api/tracking/[token]/send-whatsapp/route.ts` → Eliminar
  - Crear Supabase Edge Function
- **Acción**: Mover lógica a Supabase Edge Function
- **Descripción**: La integración con WhatsApp requiere servidor, usar Edge Function

### ✅ Tarea 7.4: Actualizar TrackingPageClient

- **Archivo**: `app/track/TrackingPageClient.tsx`
- **Acción**: Reemplazar todas las llamadas a API routes con Supabase directo
- **Nota**: Verificar que funciona con RLS público (sin autenticación)

---

## 8. Limpieza (3 tareas)

### ✅ Tarea 8.1: Eliminar API routes migradas

- **Archivos**: `app/api/*` (todas las rutas migradas)
- **Acción**: Eliminar todos los archivos de API routes después de migrar
- **Verificación**: Asegurar que no quedan referencias en el código

### ✅ Tarea 8.2: Remover imports de servidor

- **Archivos**: Todos los hooks y componentes
- **Acción**: Buscar y eliminar imports de `@/lib/supabase/server`
- **Herramienta**: Usar `grep` para encontrar todas las referencias

### ✅ Tarea 8.3: Actualizar validaciones Zod

- **Archivos**: Componentes y hooks que usan validación
- **Acción**: Asegurar que todas las validaciones Zod se ejecutan en cliente
- **Descripción**: Las validaciones deben estar en el cliente, no en API routes

---

## 9. Testing (8 tareas)

### ✅ Tarea 9.1: Verificar build estático

- **Comando**: `npm run build`
- **Verificación**: El build debe completarse sin errores y generar archivos en `out/`
- **Nota**: Verificar que no hay errores de SSR/SSG

### ✅ Tarea 9.2: Verificar Capacitor sync

- **Comando**: `npm run cap:sync`
- **Verificación**: Capacitor debe sincronizar correctamente los archivos estáticos
- **Nota**: Verificar que `webDir: "out"` está configurado correctamente

### ✅ Tarea 9.3: Probar app en navegador (SPA)

- **Acción**: Servir `out/` con servidor estático (ej: `npx serve out`)
- **Verificación**: La app debe funcionar como SPA pura
- **Nota**: Verificar que no hay errores de consola relacionados con API routes

### ✅ Tarea 9.4: Probar app en Android/iOS

- **Acción**: Abrir app en dispositivo/emulador
- **Verificación**: La app debe abrirse y funcionar correctamente
- **Nota**: Verificar que no hay errores de red (404 en API routes)

### ✅ Tarea 9.5: Verificar autenticación

- **Acción**: Probar login, logout, refresh token
- **Verificación**: La autenticación debe funcionar correctamente
- **Nota**: Verificar que las sesiones se mantienen correctamente sin middleware

### ✅ Tarea 9.6: Verificar funcionalidades principales

- **Acciones**:
  - CRUD de orders
  - CRUD de couriers
  - Asignación de pedidos
  - Cambio de estado
  - Tracking de ubicaciones
- **Verificación**: Todas las funcionalidades deben funcionar correctamente

### ✅ Tarea 9.7: Verificar funcionalidades offline

- **Acción**: Probar con modo avión o sin conexión
- **Verificación**: La app debe manejar offline correctamente con caché
- **Nota**: Verificar que los datos se sincronizan al volver online

### ✅ Tarea 9.8: Verificar notificaciones push

- **Acción**: Probar notificaciones push en dispositivo móvil
- **Verificación**: Las notificaciones deben recibirse correctamente
- **Nota**: Verificar tanto en Android como iOS si aplica

---

## 10. Optimización (3 tareas)

### ✅ Tarea 10.1: Implementar caché offline

- **Archivos**: Crear servicio de caché
- **Acción**: Implementar caché local para datos frecuentes (orders, couriers)
- **Herramienta**: Usar IndexedDB o localStorage según necesidades

### ✅ Tarea 10.2: Optimizar bundle size

- **Comando**: `npm run build` y analizar bundle
- **Herramienta**: `@next/bundle-analyzer` o similar
- **Acción**: Identificar y optimizar dependencias grandes
- **Nota**: Verificar que el bundle es razonable para móvil

### ✅ Tarea 10.3: Configurar service worker (PWA)

- **Archivos**: `public/sw.js` o similar
- **Acción**: Configurar service worker para PWA
- **Descripción**: Habilitar instalación como PWA y caché offline avanzado

---

## 📊 Progreso de Migración

### Estado General

- **Total de tareas**: 45
- **Completadas**: 0
- **En progreso**: 0
- **Pendientes**: 45

### Por Módulo

- ✅ Configuración Base: 0/4
- ✅ Módulo Orders: 0/8
- ✅ Módulo Couriers: 0/4
- ✅ Módulo Locations: 0/3
- ✅ Módulo Notifications: 0/4
- ✅ Módulo Proofs: 0/4
- ✅ Módulo Tracking: 0/4
- ✅ Limpieza: 0/3
- ✅ Testing: 0/8
- ✅ Optimización: 0/3

---

## 🎯 Orden Recomendado de Ejecución

1. **Fase 1: Configuración Base** (Tareas 1.1 - 1.4)

   - Preparar el proyecto para SPA
   - Verificar que el build funciona

2. **Fase 2: Migración por Módulos** (Tareas 2.1 - 7.4)

   - Empezar con módulos más simples (Locations, Couriers)
   - Continuar con módulos más complejos (Orders, Proofs)
   - Dejar Tracking para el final (requiere Edge Function)

3. **Fase 3: Limpieza** (Tareas 8.1 - 8.3)

   - Eliminar código obsoleto
   - Verificar que no quedan referencias

4. **Fase 4: Testing** (Tareas 9.1 - 9.8)

   - Probar exhaustivamente todas las funcionalidades
   - Corregir bugs encontrados

5. **Fase 5: Optimización** (Tareas 10.1 - 10.3)
   - Mejorar rendimiento
   - Habilitar PWA

---

## 📝 Notas Importantes

### Seguridad

- ✅ RLS de Supabase ya maneja permisos (excelente)
- ⚠️ Validaciones Zod deben moverse al cliente o Edge Functions
- ⚠️ No exponer `service_role` key en el cliente

### Performance

- Las llamadas directas a Supabase son más rápidas (menos hops)
- Realtime subscriptions funcionan igual
- Considerar caché local para datos frecuentes

### Funcionalidades Especiales

1. **Upload de archivos (proofs)**: Usar `createSignedUploadUrl()` directamente
2. **Generación de códigos de pedido**: Database function o trigger en Supabase
3. **Notificaciones push**: Registrar directamente desde cliente con Capacitor
4. **WhatsApp integration**: Mover a Supabase Edge Function

---

## 🔗 Referencias

- [Análisis Completo](./ANALISIS_SPA_CAPACITOR.md)
- [Documentación Next.js Export](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Documentación Supabase Client](https://supabase.com/docs/reference/javascript/introduction)
- [Documentación Capacitor](https://capacitorjs.com/docs)

---

**Última actualización**: {{ fecha }}  
**Versión del documento**: 1.0
