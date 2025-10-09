// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  experimental: {
    optimizeCss: false, // Deshabilitar critters
  },
  // Otra opción: configurar webpack para excluir critters
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        critters: false,
      };
    }
    return config;
  }
};

export default nextConfig;