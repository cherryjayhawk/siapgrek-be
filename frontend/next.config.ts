import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Analytic Service (Go/Fiber) — :3002
      {
        source: "/api/sensor",
        destination: "http://localhost:3002/api/v1/telemetry/latest",
      },
      {
        source: "/api/history",
        destination: "http://localhost:3002/api/v1/telemetry/history",
      },
      {
        source: "/api/command-log",
        destination: "http://localhost:3002/api/v1/command-log",
      },
      // Auth Service (Hono/BetterAuth) — :3001
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/api/auth/:path*",
      },
      // Intelligent Service (FastAPI) — :3003
      {
        source: "/api/predict",
        destination: "http://localhost:3003/predict",
      },
      {
        source: "/api/predictions",
        destination: "http://localhost:3003/predictions",
      },
      {
        source: "/api/insights",
        destination: "http://localhost:3003/api/v1/insights",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3003/uploads/:path*",
      },
      // Knowledge Service (Hono/MCP) — :3004
      {
        source: "/api/knowledge/:path*",
        destination: "http://localhost:3004/:path*",
      },
      // Ingestion Service HTTP bridge — :3005
      {
        source: "/api/command",
        destination: "http://localhost:3005/api/v1/command",
      },
    ];
  },
};

export default nextConfig;
