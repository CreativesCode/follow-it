#!/usr/bin/env node

/**
 * Script de verificación de OpenGraph
 *
 * Este script verifica que todos los requisitos para OpenGraph estén cumplidos
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Verificando configuración de OpenGraph...\n");

const checks = [];

// 1. Verificar que existe la imagen
const imagePath = path.join(__dirname, "..", "public", "opengraph.jpg");
if (fs.existsSync(imagePath)) {
  const stats = fs.statSync(imagePath);
  const sizeKB = stats.size / 1024;

  checks.push({
    name: "Imagen existe",
    status: true,
    message: `✅ La imagen existe (${Math.round(sizeKB)}KB)`,
  });

  if (sizeKB > 300) {
    checks.push({
      name: "Tamaño de imagen",
      status: false,
      message: `❌ La imagen es muy grande (${Math.round(
        sizeKB
      )}KB). Debe ser menor a 300KB`,
    });
  } else {
    checks.push({
      name: "Tamaño de imagen",
      status: true,
      message: `✅ Tamaño correcto (${Math.round(sizeKB)}KB < 300KB)`,
    });
  }
} else {
  checks.push({
    name: "Imagen existe",
    status: false,
    message: "❌ No se encontró public/opengraph.jpg",
  });
}

// 2. Verificar middleware
const middlewarePath = path.join(__dirname, "..", "middleware.ts");
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, "utf-8");

  if (
    middlewareContent.includes("opengraph\\.jpg") ||
    middlewareContent.includes("opengraph.jpg")
  ) {
    checks.push({
      name: "Middleware excluye imagen",
      status: true,
      message: "✅ El middleware excluye correctamente opengraph.jpg",
    });
  } else {
    checks.push({
      name: "Middleware excluye imagen",
      status: false,
      message: "❌ El middleware podría estar bloqueando opengraph.jpg",
    });
  }
}

// 3. Verificar next.config.ts
const nextConfigPath = path.join(__dirname, "..", "next.config.ts");
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");

  if (nextConfigContent.includes("opengraph.jpg")) {
    checks.push({
      name: "Headers en next.config.ts",
      status: true,
      message: "✅ Headers configurados en next.config.ts",
    });
  } else {
    checks.push({
      name: "Headers en next.config.ts",
      status: "warning",
      message:
        "⚠️  No se encontraron headers específicos para opengraph.jpg en next.config.ts",
    });
  }
}

// 4. Verificar vercel.json
const vercelJsonPath = path.join(__dirname, "..", "vercel.json");
if (fs.existsSync(vercelJsonPath)) {
  const vercelJsonContent = fs.readFileSync(vercelJsonPath, "utf-8");

  if (vercelJsonContent.includes("opengraph.jpg")) {
    checks.push({
      name: "Headers en vercel.json",
      status: true,
      message: "✅ Headers configurados en vercel.json",
    });
  } else {
    checks.push({
      name: "Headers en vercel.json",
      status: "warning",
      message:
        "⚠️  No se encontraron headers específicos para opengraph.jpg en vercel.json",
    });
  }
}

// 5. Verificar layout.tsx
const layoutPath = path.join(__dirname, "..", "app", "layout.tsx");
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  if (layoutContent.includes("openGraph")) {
    checks.push({
      name: "Meta tags en layout.tsx",
      status: true,
      message: "✅ Meta tags de OpenGraph configurados en layout.tsx",
    });
  } else {
    checks.push({
      name: "Meta tags en layout.tsx",
      status: false,
      message: "❌ No se encontraron meta tags de OpenGraph en layout.tsx",
    });
  }

  if (layoutContent.includes("metadataBase")) {
    checks.push({
      name: "metadataBase configurado",
      status: true,
      message: "✅ metadataBase configurado correctamente",
    });
  } else {
    checks.push({
      name: "metadataBase configurado",
      status: false,
      message: "❌ metadataBase no está configurado",
    });
  }
}

// 6. Verificar variables de entorno
const envExample = path.join(__dirname, "..", ".env.example");
const envLocal = path.join(__dirname, "..", ".env.local");

if (fs.existsSync(envLocal)) {
  const envContent = fs.readFileSync(envLocal, "utf-8");

  if (envContent.includes("NEXT_PUBLIC_SITE_URL")) {
    checks.push({
      name: "Variable NEXT_PUBLIC_SITE_URL",
      status: true,
      message: "✅ NEXT_PUBLIC_SITE_URL está definida en .env.local",
    });
  } else {
    checks.push({
      name: "Variable NEXT_PUBLIC_SITE_URL",
      status: "warning",
      message:
        "⚠️  NEXT_PUBLIC_SITE_URL no está definida en .env.local (puede estar en Vercel)",
    });
  }
} else {
  checks.push({
    name: "Archivo .env.local",
    status: "warning",
    message: "⚠️  No se encontró .env.local (puede estar en Vercel)",
  });
}

// Mostrar resultados
console.log("📋 Resultados de la verificación:\n");

let hasErrors = false;
let hasWarnings = false;

checks.forEach((check) => {
  console.log(check.message);
  if (check.status === false) hasErrors = true;
  if (check.status === "warning") hasWarnings = true;
});

console.log("\n" + "=".repeat(60) + "\n");

if (hasErrors) {
  console.log("❌ Se encontraron errores que deben corregirse.");
} else if (hasWarnings) {
  console.log("⚠️  Todo funciona pero hay algunas advertencias.");
} else {
  console.log("✅ Todo está configurado correctamente!");
}

console.log(
  "\n📖 Para más información, consulta: docs/OPENGRAPH_WHATSAPP_FIX.md\n"
);

console.log("🔗 Próximos pasos:");
console.log("   1. Despliega tu aplicación en producción");
console.log("   2. Visita: https://TU-DOMINIO/debug-og");
console.log(
  "   3. Usa Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/"
);
console.log("   4. Comparte en WhatsApp y verifica\n");

process.exit(hasErrors ? 1 : 0);
