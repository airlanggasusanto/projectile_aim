import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  
  basePath: isProduction ? "/projectile_aim" : "",

  allowedDevOrigins: ["192.168.1.5"],

  images: {
    unoptimized: true, // Required for next/image to work with static exports
  },
};

export default nextConfig;