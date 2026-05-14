import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./tools";
import type { Context } from "hono";

/**
 * Handles incoming MCP requests via Streamable HTTP transport.
 * Creates a fresh stateless server + transport per request.
 */
export async function handleMcpRequest(c: Context): Promise<Response> {
    const transport = new WebStandardStreamableHTTPServerTransport();
    const server = createMcpServer();
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
}
