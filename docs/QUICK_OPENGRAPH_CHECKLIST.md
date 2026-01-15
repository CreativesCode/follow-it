# Checklist Rápido: OpenGraph en WhatsApp

## ⚡ Si la imagen NO aparece en WhatsApp

### Paso 1: Verifica la configuración local

```bash
npm run verify:og
```

### Paso 2: Verifica que estás en producción

❌ **NO funcionará en localhost**
✅ Debe ser una URL pública con HTTPS

### Paso 3: Visita tu página de debug

```
https://TU-DOMINIO.com/debug-og
```

Verifica que:

- [ ] Los meta tags `og:image` tengan la URL completa con HTTPS
- [ ] La URL de la imagen sea accesible públicamente
- [ ] La imagen cargue correctamente en la página

### Paso 4: Prueba la API de verificación

```
https://TU-DOMINIO.com/api/test-og
```

Debe mostrar:

- `accessible: true`
- `status: 200`

### Paso 5: Usa Facebook Sharing Debugger

1. Ve a: https://developers.facebook.com/tools/debug/
2. Pega tu URL de producción
3. Haz clic en **"Scrape Again"** (varias veces)
4. Verifica que la imagen aparezca

### Paso 6: Limpia el caché de WhatsApp

**Opción A: Cambiar nombre de archivo (RECOMENDADO)**

```bash
# En tu proyecto local
mv public/opengraph.jpg public/opengraph-v2.jpg

# Actualizar app/layout.tsx línea 45
# Cambiar: /opengraph.jpg → /opengraph-v2.jpg
```

**Opción B: Agregar parámetro de versión**

```typescript
// En app/layout.tsx
const ogImageUrl = `${siteUrl}/opengraph.jpg?v=2`;
```

### Paso 7: Despliega y prueba

```bash
git add .
git commit -m "fix: update opengraph configuration"
git push
```

Espera a que se despliegue y prueba nuevamente con el Facebook Debugger.

### Paso 8: Prueba en WhatsApp

- Copia tu URL de producción
- Envía en WhatsApp
- Espera 5-10 segundos para la vista previa

## 🐛 Problemas Comunes

### La imagen no carga en /debug-og

**Solución:** Verifica que `public/opengraph.jpg` existe

### Facebook Debugger no ve la imagen

**Solución:**

- Verifica que la URL use HTTPS
- Haz clic en "Scrape Again" varias veces
- Espera 1-2 minutos y prueba de nuevo

### La imagen aparece en Facebook pero no en WhatsApp

**Solución:**

- WhatsApp tiene un caché MUY agresivo
- Cambia el nombre de la imagen
- O espera días/semanas para que se actualice

### La URL en los meta tags es localhost

**Solución:**

- Configura `NEXT_PUBLIC_SITE_URL` en Vercel
- Despliega de nuevo

### Error 403 o 404 al acceder a la imagen

**Solución:**

- Verifica que el middleware excluya opengraph.jpg
- Verifica que la imagen esté en `/public/` no en `/assets/`

## ✅ Verificación Final

Antes de compartir en WhatsApp, asegúrate de que:

- [ ] `npm run verify:og` pasa sin errores
- [ ] La imagen carga en `https://TU-DOMINIO.com/opengraph.jpg`
- [ ] La página `/debug-og` muestra todos los meta tags correctamente
- [ ] Facebook Sharing Debugger muestra la imagen
- [ ] La URL usa HTTPS (no HTTP)
- [ ] No estás probando con localhost
- [ ] Has limpiado el caché (cambiado nombre o versión de imagen)

## 📞 ¿Sigue sin funcionar?

1. Lee la guía completa: `docs/OPENGRAPH_WHATSAPP_FIX.md`
2. Verifica los logs de producción en Vercel
3. Revisa la consola del navegador en DevTools
4. Prueba con diferentes dispositivos

## 🎯 Comando Rápido de Emergencia

Si necesitas que funcione YA:

```bash
# 1. Crear imagen con timestamp
cp public/opengraph.jpg "public/og-$(date +%s).jpg"

# 2. Anotar el nombre del nuevo archivo

# 3. Actualizar app/layout.tsx con el nuevo nombre

# 4. Desplegar
git add .
git commit -m "fix: update og image with cache busting"
git push
```

## 📚 Recursos

- [Guía completa](./OPENGRAPH_WHATSAPP_FIX.md)
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [OpenGraph.xyz](https://www.opengraph.xyz/)
