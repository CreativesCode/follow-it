import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Las Edge Functions de Supabase están excluidas en tsconfig.json
  // Estas funciones usan Deno runtime, no Node.js

  // Configuración para exportación estática (requerida para Capacitor)
  output: "export",

  // Deshabilitar optimización de imágenes para exportación estática
  images: {
    unoptimized: true,
  },

  // Las API routes no están disponibles en exportación estática
  // En Capacitor, las llamadas deben ir directamente a Supabase o backend externo

  // Excluir rutas que no pueden ser exportadas estáticamente
  // /auth/callback se maneja mediante deep links en Capacitor
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

export default nextConfig;
