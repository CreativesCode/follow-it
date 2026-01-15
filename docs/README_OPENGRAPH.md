# Documentación OpenGraph - Follow It

## 📚 Índice de Documentación

Esta carpeta contiene toda la documentación relacionada con la configuración de OpenGraph para redes sociales, especialmente WhatsApp.

### 📖 Guías Disponibles

1. **[OPENGRAPH_RESUMEN.md](./OPENGRAPH_RESUMEN.md)** ⭐ **EMPIEZA AQUÍ**

   - Resumen ejecutivo de todo lo implementado
   - Estado actual del proyecto
   - Checklist final
   - Próximos pasos

2. **[QUICK_OPENGRAPH_CHECKLIST.md](./QUICK_OPENGRAPH_CHECKLIST.md)** ⚡ **SOLUCIÓN RÁPIDA**

   - Checklist rápido de 8 pasos
   - Para cuando necesitas resolver el problema YA
   - Problemas comunes y soluciones

3. **[OPENGRAPH_WHATSAPP_FIX.md](./OPENGRAPH_WHATSAPP_FIX.md)** 🔧 **GUÍA COMPLETA**

   - Guía detallada paso a paso
   - 10 pasos de diagnóstico y solución
   - Troubleshooting exhaustivo
   - Referencias a recursos externos

4. **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** ⚙️ **CONFIGURACIÓN**
   - Variables de entorno requeridas
   - Cómo configurar en Vercel
   - Ejemplos correctos e incorrectos
   - Verificación de configuración

## 🚀 Inicio Rápido

### Si es tu primera vez configurando OpenGraph:

1. Lee **[OPENGRAPH_RESUMEN.md](./OPENGRAPH_RESUMEN.md)** para entender qué se ha hecho
2. Sigue **[QUICK_OPENGRAPH_CHECKLIST.md](./QUICK_OPENGRAPH_CHECKLIST.md)** para configurar
3. Consulta **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** para configurar Vercel
4. Usa **[OPENGRAPH_WHATSAPP_FIX.md](./OPENGRAPH_WHATSAPP_FIX.md)** si tienes problemas

### Si ya lo configuraste pero no funciona en WhatsApp:

1. Ve directo a **[QUICK_OPENGRAPH_CHECKLIST.md](./QUICK_OPENGRAPH_CHECKLIST.md)**
2. Revisa la sección "Problemas Comunes" en **[OPENGRAPH_WHATSAPP_FIX.md](./OPENGRAPH_WHATSAPP_FIX.md)**

## 🛠️ Herramientas Disponibles

### Comando de Verificación

```bash
npm run verify:og
```

Verifica toda la configuración local de OpenGraph.

### Páginas de Debug

```
https://tu-dominio.com/debug-og      # Página completa de diagnóstico
https://tu-dominio.com/api/test-og   # API de verificación
```

### Validadores Externos

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [OpenGraph.xyz](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

## 📝 Archivos Implementados

### Páginas y Componentes

- `app/debug-og/page.tsx` - Página de diagnóstico completa
- `app/api/test-og/route.ts` - API de verificación
- `components/ui/SocialPreview.tsx` - Vista previa visual

### Scripts

- `scripts/verify-og.js` - Script de verificación automática

### Configuración

- `app/layout.tsx` - Meta tags globales mejorados
- `app/track/[token]/page.tsx` - Meta tags para tracking
- `middleware.ts` - Ya configurado correctamente
- `next.config.ts` - Headers configurados
- `vercel.json` - Headers CORS configurados

## ❓ Preguntas Frecuentes

### ¿Por qué la imagen no aparece en WhatsApp?

**R:** WhatsApp tiene un caché muy agresivo. Lee la sección "Limpiar caché de WhatsApp" en [QUICK_OPENGRAPH_CHECKLIST.md](./QUICK_OPENGRAPH_CHECKLIST.md)

### ¿Funciona en localhost?

**R:** NO. WhatsApp necesita una URL pública con HTTPS. Debes probar en producción.

### ¿Cuánto tarda en actualizarse?

**R:** En la mayoría de redes sociales es inmediato. WhatsApp puede tardar días o semanas si ya cacheó una versión anterior.

### ¿Qué hago si ya compartí el enlace antes?

**R:** Cambia el nombre de la imagen (ej: opengraph-v2.jpg) para forzar a WhatsApp a descargar una nueva versión.

### ¿Cómo pruebo si funciona?

**R:**

1. Usa Facebook Sharing Debugger (también funciona para WhatsApp)
2. Visita `/debug-og` en tu sitio de producción
3. Comparte en WhatsApp y espera 5-10 segundos

## 🎯 Checklist Mínimo

Antes de compartir en WhatsApp:

- [ ] `NEXT_PUBLIC_SITE_URL` configurada en Vercel
- [ ] Desplegado en producción (no localhost)
- [ ] `npm run verify:og` pasa sin errores
- [ ] Facebook Debugger muestra la imagen correctamente
- [ ] Has limpiado el caché (si ya compartiste antes)

## 📞 Soporte

Si después de seguir todas las guías el problema persiste:

1. Ejecuta `npm run verify:og` y comparte el resultado
2. Visita `/debug-og` en producción y revisa los meta tags
3. Prueba en Facebook Sharing Debugger y comparte el resultado
4. Revisa la consola del navegador en DevTools (tab Network)

## 📊 Estado del Proyecto

### ✅ Completado

- Configuración de meta tags
- Herramientas de diagnóstico
- Scripts de verificación
- Documentación completa

### ⏳ Pendiente (Requiere tu acción)

- Configurar `NEXT_PUBLIC_SITE_URL` en Vercel
- Desplegar a producción
- Validar con Facebook Sharing Debugger
- Probar en WhatsApp

## 🔄 Flujo de Trabajo Recomendado

```
1. Lee OPENGRAPH_RESUMEN.md
   ↓
2. Configura NEXT_PUBLIC_SITE_URL (ver ENV_VARIABLES.md)
   ↓
3. Despliega a producción
   ↓
4. Ejecuta: npm run verify:og
   ↓
5. Visita: https://tu-dominio.com/debug-og
   ↓
6. Valida en Facebook Debugger
   ↓
7. Si ya compartiste antes: cambia nombre de imagen
   ↓
8. Prueba en WhatsApp
   ↓
9. Si no funciona: consulta OPENGRAPH_WHATSAPP_FIX.md
```

## 📅 Última Actualización

**Fecha:** 15 de enero de 2026  
**Versión:** 1.0  
**Autor:** Equipo Follow It

---

## 💡 Tip Final

La configuración de OpenGraph ya está completa en el código. El problema más común es:

1. **No configurar la variable de entorno en Vercel**
2. **Probar en localhost en lugar de producción**
3. **No limpiar el caché de WhatsApp después de cambios**

Si sigues los pasos de las guías, funcionará correctamente. 🎉
