import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Las Edge Functions de Supabase están excluidas en tsconfig.json
  // Estas funciones usan Deno runtime, no Node.js

  // NOTA: Para desarrollo, no usamos exportación estática para permitir API routes
  // Para producción con Capacitor, se puede cambiar a "export" y las llamadas
  // deben ir directamente a Supabase desde el cliente
  // output: "export",

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
