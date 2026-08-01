import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.96', 'localhost:3002'],
  distDir: ".next_custom",
};

export default nextConfig;
