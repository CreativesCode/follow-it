# Migraciones de Base de Datos - Follow It

Este directorio contiene las migraciones SQL para configurar el esquema completo de la base de datos del sistema de gestión de repartos.

## 📋 Estructura de Migraciones

Las migraciones están organizadas en orden de ejecución:

1. **`20240101000000_initial_schema.sql`**
   - Extensiones PostgreSQL (`pgcrypto`)
   - Tipos enumerados (enums): `order_status`, `order_event_type`, `proof_type`
   - Todas las tablas principales:
     - `businesses` - Negocios/tenants
     - `business_members` - Miembros del negocio (admin/operator)
     - `couriers` - Mensajeros
     - `customers` - Clientes
     - `orders` - Pedidos
     - `order_events` - Eventos/timeline de pedidos
     - `order_proofs` - Comprobantes (fotos/firmas)
     - `courier_locations` - Ubicaciones GPS de mensajeros
     - `order_tracking_links` - Links de tracking público

2. **`20240101000001_indexes_and_triggers.sql`**
   - Índices para optimizar consultas
   - Función trigger `set_updated_at()` para actualizar automáticamente `updated_at`
   - Trigger en tabla `orders`

3. **`20240101000002_rls_policies.sql`**
   - Habilita Row Level Security (RLS) en todas las tablas
   - Funciones helper:
     - `is_business_member()` - Verifica si un usuario es miembro de un negocio
     - `get_courier_id()` - Obtiene el ID del mensajero para un usuario
   - Políticas RLS para cada tabla (multi-tenant seguro)

## 🚀 Cómo Aplicar las Migraciones

### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# Asegúrate de estar enlazado a tu proyecto
npx supabase link --project-ref tu-project-ref

# Aplicar todas las migraciones pendientes
npx supabase db push

# O aplicar migraciones específicas
npx supabase migration up
```

### Opción 2: Desde Supabase Dashboard

1. Ve a tu proyecto en https://supabase.com
2. Navega a **SQL Editor**
3. Ejecuta cada migración en orden:
   - Copia y pega el contenido de `20240101000000_initial_schema.sql`
   - Ejecuta
   - Repite con `20240101000001_indexes_and_triggers.sql`
   - Repite con `20240101000002_rls_policies.sql`

### Opción 3: Usando Supabase CLI Local

```bash
# Iniciar Supabase localmente (requiere Docker)
npx supabase start

# Aplicar migraciones localmente
npx supabase db reset

# O aplicar migraciones específicas
npx supabase migration up
```

## ✅ Verificación

Después de aplicar las migraciones, verifica que:

1. **Tablas creadas**: Deberías ver 9 tablas en el esquema `public`
2. **Enums creados**: Verifica en el SQL Editor ejecutando:
   ```sql
   SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace;
   ```
3. **RLS habilitado**: Todas las tablas deben tener RLS activado
4. **Funciones helper**: Verifica que existen:
   ```sql
   SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
   ```

## 📝 Notas Importantes

- **Orden de ejecución**: Las migraciones deben ejecutarse en orden cronológico (por timestamp)
- **Dependencias**: La migración de RLS depende de que las tablas existan (migración 1)
- **Backup**: Siempre haz backup antes de aplicar migraciones en producción
- **Testing**: Prueba primero en un entorno de desarrollo/staging

## 🔄 Rollback

Si necesitas revertir una migración:

```bash
# Ver migraciones aplicadas
npx supabase migration list

# Revertir última migración
npx supabase migration down
```

## 📚 Documentación Relacionada

- Especificaciones completas: `docs/instructions.md`
- Comandos de setup: `docs/COMANDOS.md`
- Edge Functions: `supabase/functions/`

## 🛠️ Crear Nueva Migración

Para crear una nueva migración:

```bash
# Crear archivo de migración con timestamp
npx supabase migration new nombre_de_la_migracion
```

Esto creará un archivo con formato: `YYYYMMDDHHMMSS_nombre_de_la_migracion.sql`
