import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const getUrl = (port: string) => process.env.BACKEND_URL || `http://localhost:${port}`;
    return [
      // Analytic Service (Go/Fiber) — :3002
      {
        source: "/api/sensor",
        destination: `${getUrl('3002')}/api/v1/telemetry/latest`,
      },
      {
        source: "/api/history",
        destination: `${getUrl('3002')}/api/v1/telemetry/history`,
      },
      {
        source: "/api/command-log",
        destination: `${getUrl('3002')}/api/v1/command-log`,
      },
      // Auth Service (Hono/BetterAuth) — :3001
      {
        source: "/api/auth/:path*",
        destination: `${getUrl('3001')}/api/auth/:path*`,
      },
      // Intelligent Service (FastAPI) — :3003
      {
        source: "/api/predict",
        destination: `${getUrl('3003')}/predict`,
      },
      {
        source: "/api/predictions",
        destination: `${getUrl('3003')}/predictions`,
      },
      {
        source: "/api/insights",
        destination: `${getUrl('3003')}/api/v1/insights`,
      },
      {
        source: "/api/chat",
        destination: `${getUrl('3003')}/api/v1/chat`,
      },
      {
        source: "/api/chat-sessions",
        destination: `${getUrl('3003')}/api/v1/chat-sessions`,
      },
      {
        source: "/api/chat-sessions/:path*",
        destination: `${getUrl('3003')}/api/v1/chat-sessions/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${getUrl('3003')}/uploads/:path*`,
      },
      // Knowledge APIs in Intelligent Service — :3003
      {
        source: "/api/knowledge/:path*",
        destination: `${getUrl('3003')}/api/v1/knowledge/:path*`,
      },
      // Ingestion Service HTTP bridge — :3005
      {
        source: "/api/command",
        destination: `${getUrl('3005')}/api/v1/command`,
      },
    ];
  },
};

export default nextConfig;
