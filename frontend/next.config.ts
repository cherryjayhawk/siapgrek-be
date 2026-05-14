import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/sensor",
        destination: "http://localhost:3002/api/v1/telemetry/latest",
      },
      {
        source: "/api/history",
        destination: "http://localhost:3002/api/v1/telemetry/history",
      },
      {
        source: "/api/anomaly",
        destination: "http://localhost:3003/api/anomaly",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/api/auth/:path*",
      },
      {
        source: "/api/knowledge/:path*",
        destination: "http://localhost:3004/:path*",
      },
    ];
  },
};

export default nextConfig;
