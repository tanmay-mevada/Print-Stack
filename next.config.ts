import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // This prevents Vercel from crashing by keeping heavy libraries out of the main bundle
  experimental: {
    serverComponentsExternalPackages: ['pdf-lib', 'leaflet'],
  },
};

export default nextConfig;