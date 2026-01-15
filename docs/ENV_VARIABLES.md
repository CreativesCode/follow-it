# Variables de Entorno Requeridas

## Variables Críticas para OpenGraph

### NEXT_PUBLIC_SITE_URL

**CRÍTICO:** Esta variable es absolutamente necesaria para que OpenGraph funcione correctamente en WhatsApp.

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

**Características:**

- Debe incluir el protocolo (`https://`)
- NO debe incluir trailing slash al final
- NO usar `http://` en producción (WhatsApp lo rechazará)
- NO usar `localhost` en producción

**Ejemplos correctos:**

```bash
# Si usas el dominio de Vercel
NEXT_PUBLIC_SITE_URL=https://follow-it.vercel.app

# Si tienes dominio personalizado
NEXT_PUBLIC_SITE_URL=https://follow-it.com

# Si usas subdominio
NEXT_PUBLIC_SITE_URL=https://app.follow-it.com
```

**Ejemplos incorrectos:**

```bash
# ❌ Sin protocolo
NEXT_PUBLIC_SITE_URL=follow-it.com

# ❌ Con trailing slash
NEXT_PUBLIC_SITE_URL=https://follow-it.com/

# ❌ Con HTTP en producción
NEXT_PUBLIC_SITE_URL=http://follow-it.com

# ❌ Con localhost en producción
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Variables de Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Estas variables las obtienes de tu proyecto de Supabase en:
**Project Settings → API**

## Variables de Vercel (Automáticas)

Estas variables son generadas automáticamente por Vercel, NO necesitas definirlas:

```bash
# Generadas automáticamente por Vercel
NEXT_PUBLIC_VERCEL_URL=auto-generated
VERCEL_URL=auto-generated
VERCEL_ENV=production|preview|development
```

## Configuración en Vercel

### Paso 1: Ir a tu proyecto en Vercel

1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. Ve a **Settings → Environment Variables**

### Paso 2: Agregar variables

1. Haz clic en **Add New**
2. Agrega cada variable:

**Variable 1:**

- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Tu URL de Supabase
- Environments: Production, Preview, Development

**Variable 2:**

- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Tu Anon Key de Supabase
- Environments: Production, Preview, Development

**Variable 3 (CRÍTICA PARA OPENGRAPH):**

- Key: `NEXT_PUBLIC_SITE_URL`
- Value: `https://tu-dominio.com` (tu URL de producción)
- Environments: Production, Preview

### Paso 3: Redesplegar

Después de agregar las variables, debes redesplegar tu aplicación:

1. Ve a **Deployments**
2. Haz clic en los tres puntos del último deployment
3. Selecciona **Redeploy**

## Configuración Local (.env.local)

Para desarrollo local, crea un archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local (desarrollo local)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**IMPORTANTE:**

- Este archivo NO debe subirse a Git (está en .gitignore)
- En desarrollo local puedes usar `http://localhost:3000`
- En producción SIEMPRE usa HTTPS

## Verificación

### Verificar en local:

```bash
# Ver variables definidas
npm run verify:og
```

### Verificar en producción:

1. Visita: `https://tu-dominio.com/debug-og`
2. Revisa la sección "Variables de Entorno (Públicas)"
3. Verifica que `NEXT_PUBLIC_SITE_URL` tenga tu dominio de producción

### Verificar en la API:

```bash
curl https://tu-dominio.com/api/test-og
```

Debe mostrar:

```json
{
  "env": {
    "NEXT_PUBLIC_SITE_URL": "https://tu-dominio.com",
    ...
  }
}
```

## Troubleshooting

### La variable no se actualiza en Vercel

**Solución:**

1. Verifica que agregaste la variable en Vercel Dashboard
2. Redesplega la aplicación
3. Espera 2-3 minutos para que se propague
4. Limpia el caché de Vercel (en Deployment settings)

### Los meta tags usan localhost en producción

**Solución:**

1. Agrega `NEXT_PUBLIC_SITE_URL` en Vercel
2. Redesplega
3. Verifica en `/debug-og`

### WhatsApp no ve la imagen

**Solución:**

1. Verifica que `NEXT_PUBLIC_SITE_URL` use HTTPS
2. Verifica que la URL sea accesible públicamente
3. Usa Facebook Sharing Debugger para validar
4. Cambia el nombre de la imagen para limpiar caché

## Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
