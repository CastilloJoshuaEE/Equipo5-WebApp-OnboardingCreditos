import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ejecutar ESLint durante el build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: false,
  },
  // Configuración para Render.com
  output: 'standalone',
  experimental: {
    // Mejorar rendimiento en producción
    optimizeCss: true,
  }
};

export default nextConfig;