import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Las Edge Functions de Supabase están excluidas en tsconfig.json
  // Estas funciones usan Deno runtime, no Node.js
};

export default nextConfig;
