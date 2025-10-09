// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para producción
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuración de output
  output: 'standalone',
  
  // Deshabilitar optimizaciones problemáticas
  experimental: {
    optimizeCss: false,
  },
  
  // Configuración del compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Excluir páginas de prerenderizado
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;