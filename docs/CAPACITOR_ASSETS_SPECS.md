# Especificaciones para Assets de Capacitor

## Ubicación del Archivo SVG

El archivo SVG debe estar en la carpeta `assets/` en la raíz del proyecto con el nombre `logo.svg`:

```
follow-it/
  └── assets/
      └── logo.svg  ← Aquí debe estar el ícono
```

## Especificaciones Requeridas del SVG

### 1. ViewBox (OBLIGATORIO)

El SVG **DEBE** tener un `viewBox` de **1024×1024** para evitar recortes:

```svg
<svg viewBox="0 0 1024 1024">
```

**¿Por qué?**
- `@capacitor/assets` rasteriza el SVG a diferentes tamaños (desde 48px hasta 1024px)
- Si el `viewBox` es muy pequeño (ej: `0 0 7.06 8.3`), al escalarlo se puede cortar o desalinear
- Un `viewBox` de 1024×1024 asegura que el contenido se escale correctamente

### 2. Dimensiones (Recomendado)

Incluir atributos `width` y `height` consistentes con el `viewBox`:

```svg
<svg viewBox="0 0 1024 1024" width="1024" height="1024">
```

### 3. Contenido Centrado

El contenido del ícono debe estar **centrado** dentro del `viewBox` de 1024×1024:

- Si tu diseño original es pequeño (ej: 7.06 × 8.3), usa `transform` para escalarlo y centrarlo
- Deja **padding** alrededor del contenido (mínimo 10-15% en cada lado)
- Esto evita que el ícono se corte en los bordes cuando se genera en diferentes tamaños

### 4. Formato del SVG

- ✅ Usar `viewBox` (no solo `width`/`height`)
- ✅ Incluir `xmlns="http://www.w3.org/2000/svg"`
- ✅ Evitar elementos que dependan de tamaños absolutos
- ✅ Usar `fill` en lugar de `stroke` cuando sea posible (mejor renderizado)

### 5. Tamaño Mínimo Lógico

Aunque el SVG es vectorial, el contenido debe diseñarse pensando en:
- **Íconos**: Mínimo equivalente a 1024×1024 píxeles lógicos
- **Splash screens**: Mínimo equivalente a 2732×2732 píxeles lógicos

## Ejemplo de SVG Optimizado

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <style>
      .icon-color-1 { fill: #3a5faa; }
      .icon-color-2 { fill: #4ab05e; }
    </style>
  </defs>
  <!-- Contenido centrado y escalado apropiadamente -->
  <g transform="translate(512, 512) scale(100) translate(-3.53, -4.15)">
    <!-- Tu diseño aquí -->
  </g>
</svg>
```

## Generación de Assets

Para generar los assets desde el SVG:

```bash
npm run cap:assets
```

Este comando:
1. Lee `assets/logo.svg`
2. Genera íconos para Android (múltiples resoluciones)
3. Genera íconos para iOS (1024×1024)
4. Genera splash screens
5. Genera íconos PWA

## Solución de Problemas

### El ícono se corta

**Causa**: `viewBox` muy pequeño o contenido no centrado

**Solución**:
1. Cambiar `viewBox` a `0 0 1024 1024`
2. Centrar el contenido usando `transform="translate(512, 512)"`
3. Escalar el contenido apropiadamente

### El ícono se ve borroso

**Causa**: Contenido diseñado a muy baja resolución

**Solución**: Asegurar que el diseño tenga suficiente detalle para escalarse a 1024×1024

### El ícono no se genera

**Causa**: Archivo no encontrado o formato incorrecto

**Solución**:
1. Verificar que `assets/logo.svg` existe
2. Verificar que el SVG es válido (abrir en navegador)
3. Verificar que tiene `viewBox` definido

## Referencias

- [Capacitor Assets Documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [@capacitor/assets GitHub](https://github.com/ionic-team/capacitor-assets)
