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
        origin: "*",
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

export default {
    port,
    fetch: app.fetch,
};

console.log(`📚 Knowledge service running on port ${port}`);
