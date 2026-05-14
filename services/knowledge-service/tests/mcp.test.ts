import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createMcpServer } from "../src/mcp/tools";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { join } from "path";
import { mkdir, writeFile, readdir, unlink } from "fs/promises";

// ------------------------------------
// Setup
// ------------------------------------
const DOCS_DIR = join(process.cwd(), "docs");

async function cleanDocsDir() {
    try {
        const files = await readdir(DOCS_DIR);
        for (const file of files) {
            if (file.endsWith(".md")) {
                await unlink(join(DOCS_DIR, file));
            }
        }
    } catch {
        // Directory might not exist yet
    }
}

/**
 * Helper: creates a connected MCP client+server pair
 * using in-memory transport for unit-testing.
 */
async function createTestPair() {
    const mcpServer = createMcpServer();
    const client = new Client({ name: "test-client", version: "1.0.0" });

    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();

    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);

    return { client, mcpServer };
}

// ------------------------------------
// Tests
// ------------------------------------

describe("MCP Tools — registration", () => {
    test("all 4 MCP tools are registered and discoverable", async () => {
        const { client, mcpServer } = await createTestPair();

        const result = await client.listTools();
        const toolNames = result.tools.map((t) => t.name);

        expect(toolNames).toContain("preference");
        expect(toolNames).toContain("sensor_history");
        expect(toolNames).toContain("disease_log");
        expect(toolNames).toContain("anomaly_record");

        await client.close();
        await mcpServer.close();
    });
});

describe("MCP Tools — preference", () => {
    beforeAll(async () => {
        await mkdir(DOCS_DIR, { recursive: true });
        await cleanDocsDir();

        // Seed test documents
        await writeFile(
            join(DOCS_DIR, "orchid-care.md"),
            "# Orchid Care\n\nPhalaenopsis orchids prefer 60-80% humidity.\nOptimal temperature: 20-28°C daytime.\n",
        );
        await writeFile(
            join(DOCS_DIR, "fertilizer-guide.md"),
            "# Fertilizer Guide\n\nUse 20-20-20 balanced fertilizer bi-weekly.\n",
        );
    });

    afterAll(async () => {
        await cleanDocsDir();
    });

    test("returns all documents when no topic given", async () => {
        const { client, mcpServer } = await createTestPair();

        const result = await client.callTool({
            name: "preference",
            arguments: {},
        });

        const text = (result.content as { type: string; text: string }[])[0]?.text ?? "";
        expect(text).toContain("Orchid Care");
        expect(text).toContain("Fertilizer Guide");

        await client.close();
        await mcpServer.close();
    });

    test("filters by topic keyword", async () => {
        const { client, mcpServer } = await createTestPair();

        const result = await client.callTool({
            name: "preference",
            arguments: { topic: "fertilizer" },
        });

        const text = (result.content as { type: string; text: string }[])[0]?.text ?? "";
        expect(text).toContain("Fertilizer Guide");
        expect(text).not.toContain("Orchid Care");

        await client.close();
        await mcpServer.close();
    });

    test("returns message when no docs match topic", async () => {
        const { client, mcpServer } = await createTestPair();

        const result = await client.callTool({
            name: "preference",
            arguments: { topic: "nonexistent_topic_xyz" },
        });

        const text = (result.content as { type: string; text: string }[])[0]?.text ?? "";
        expect(text).toContain("No documents found");

        await client.close();
        await mcpServer.close();
    });
});
