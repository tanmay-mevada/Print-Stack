import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // CORRECTED FOR NEXT.JS 16: Moved out of "experimental"
  // Removed 'leaflet' because its CSS breaks Vercel's server bundler
  serverExternalPackages: ['pdf-lib'],
};

export default nextConfig;