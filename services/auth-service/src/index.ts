// --- Global Logger Override for Timestamps ---
const _origLog = console.log;
const _origWarn = console.warn;
const _origError = console.error;
const _formatTime = () => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};
console.log = (...args) => _origLog(`[${_formatTime()}]`, ...args);
console.warn = (...args) => _origWarn(`[${_formatTime()}]`, ...args);
console.error = (...args) => _origError(`[${_formatTime()}]`, ...args);
// ---------------------------------------------

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";

const app = new Hono();

// ------------------------------------
// Middleware
// ------------------------------------
app.use("*", logger());

app.use("/api/auth/*", async (c, next) => {
    console.log("========== AUTH REQUEST ==========");
    console.log("Method:", c.req.method);
    console.log("URL:", c.req.url);
    console.log("Origin:", c.req.header("origin"));
    console.log("Host:", c.req.header("host"));
    console.log(
        "X-Forwarded-Host:",
        c.req.header("x-forwarded-host"),
    );
    console.log(
        "X-Forwarded-Proto:",
        c.req.header("x-forwarded-proto"),
    );
    console.log("==================================");

    await next();
});

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

console.log(`🔐 Auth service running on port ${port}`);

export default {
    port,
    fetch: app.fetch,
};
