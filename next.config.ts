import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", 
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pdf-lib'],
  // ADD THIS LINE: Tells Next.js 16 to allow the PWA Webpack config
  turbopack: {}, 
};

export default withPWA(nextConfig);