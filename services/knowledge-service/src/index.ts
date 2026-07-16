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
import { documents } from "./routes/documents";
import { handleMcpRequest } from "./mcp/server";

const app = new Hono();

// ------------------------------------
// Middleware
// ------------------------------------
app.use("*", logger());
app.use(
    "*",
    cors({
        origin: process.env["TRUSTED_ORIGINS"]
            ? process.env["TRUSTED_ORIGINS"].split(",")
            : ["http://localhost:3000"],
        allowHeaders: ["Content-Type", "Authorization", "mcp-session-id", "Last-Event-ID", "mcp-protocol-version"],
        allowMethods: ["POST", "GET", "DELETE", "OPTIONS"],
        exposeHeaders: ["mcp-session-id", "mcp-protocol-version"],
        maxAge: 600,
    }),
);

// ------------------------------------
// Health Check
// ------------------------------------
app.get("/health", (c) => {
    return c.json({ status: "ok", service: "knowledge-service" });
});

// ------------------------------------
// Document Management API
// ------------------------------------
app.route("/documents", documents);

// ------------------------------------
// MCP Endpoint (Streamable HTTP)
// ------------------------------------
app.all("/mcp", async (c) => {
    return handleMcpRequest(c);
});

// ------------------------------------
// Start Server
// ------------------------------------
const port = Number(process.env["KNOWLEDGE_PORT"] ?? 3000);

console.log(`📚 Knowledge service running on port ${port}`);

export default {
    port,
    fetch: app.fetch,
};
