import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";

const app = new Hono();

// ------------------------------------
// Middleware
// ------------------------------------
app.use("*", logger());

app.use(
    "/api/auth/*",
    cors({
        origin: process.env["TRUSTED_ORIGINS"]
            ? process.env["TRUSTED_ORIGINS"].split(",")
            : ["http://localhost:3000"],
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    }),
);

// ------------------------------------
// Health Check
// ------------------------------------
app.get("/health", (c) => {
    return c.json({ status: "ok", service: "auth-service" });
});

// ------------------------------------
// Better Auth Handler
// ------------------------------------
app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

// ------------------------------------
// Start Server
// ------------------------------------
const port = Number(process.env["AUTH_PORT"] ?? 3000);

export default {
    port,
    fetch: app.fetch,
};

console.log(`🔐 Auth service running on port ${port}`);
