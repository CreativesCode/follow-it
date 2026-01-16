import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Las Edge Functions de Supabase están excluidas en tsconfig.json
  // Estas funciones usan Deno runtime, no Node.js

  // Habilitado para SPA puro compatible con Capacitor
  // Todas las llamadas deben ir directamente a Supabase desde el cliente
  output: "export",

  // Deshabilitar optimización de imágenes para exportación estática
  images: {
    unoptimized: true,
  },

  // Las API routes no están disponibles en exportación estática
  // En Capacitor, las llamadas deben ir directamente a Supabase o backend externo
  // /auth/callback se maneja mediante deep links en Capacitor
};

export default nextConfig;
