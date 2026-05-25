import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
