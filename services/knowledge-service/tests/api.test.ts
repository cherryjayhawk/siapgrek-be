import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";
import { documents } from "../src/routes/documents";
import { join } from "path";
import { mkdir, writeFile, readdir, unlink } from "fs/promises";

// ------------------------------------
// Setup: use a temp docs dir so tests
// don't interfere with real uploads.
// ------------------------------------
const TEST_DOCS_DIR = join(import.meta.dir, "__test_docs__");

// We need to override the DOCS_DIR used by the documents router.
// The router reads from process.cwd()/docs, so we'll test against
// the actual Hono app using fetch-style requests.

const app = new Hono();
app.route("/documents", documents);

// ------------------------------------
// Helpers
// ------------------------------------

function createMdFile(name: string, content: string): File {
    const blob = new Blob([content], { type: "text/markdown" });
    return new File([blob], name, { type: "text/markdown" });
}

async function cleanDocsDir() {
    const DOCS_DIR = join(process.cwd(), "docs");
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

// ------------------------------------
// Tests
// ------------------------------------

describe("Document Management API", () => {
    beforeAll(async () => {
        // Ensure docs directory exists and is clean
        const DOCS_DIR = join(process.cwd(), "docs");
        await mkdir(DOCS_DIR, { recursive: true });
        await cleanDocsDir();
    });

    afterAll(async () => {
        await cleanDocsDir();
    });

    test("POST /documents/upload — accepts valid .md file", async () => {
        const formData = new FormData();
        formData.append("file", createMdFile("test-knowledge.md", "# Orchid Care\n\nWater twice a week."));

        const res = await app.request("/documents/upload", {
            method: "POST",
            body: formData,
        });

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.message).toBe("File uploaded successfully");
        expect(body.filename).toBe("test-knowledge.md");
    });

    test("POST /documents/upload — rejects non-.md file", async () => {
        const formData = new FormData();
        const pdfBlob = new Blob(["fake pdf"], { type: "application/pdf" });
        formData.append("file", new File([pdfBlob], "report.pdf"));

        const res = await app.request("/documents/upload", {
            method: "POST",
            body: formData,
        });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain("Only .md files");
    });

    test("POST /documents/upload — rejects missing file field", async () => {
        const formData = new FormData();
        formData.append("other", "value");

        const res = await app.request("/documents/upload", {
            method: "POST",
            body: formData,
        });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain("Missing");
    });

    test("GET /documents — lists uploaded documents", async () => {
        const res = await app.request("/documents", { method: "GET" });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.documents).toBeInstanceOf(Array);
        expect(body.documents.length).toBeGreaterThanOrEqual(1);

        const doc = body.documents.find(
            (d: { filename: string }) => d.filename === "test-knowledge.md",
        );
        expect(doc).toBeDefined();
        expect(doc.size).toBeGreaterThan(0);
        expect(doc.uploadedAt).toBeTruthy();
    });

    test("DELETE /documents/:filename — deletes existing file", async () => {
        const res = await app.request("/documents/test-knowledge.md", {
            method: "DELETE",
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toContain("Deleted");
    });

    test("DELETE /documents/:filename — 404 for non-existing file", async () => {
        const res = await app.request("/documents/nonexistent.md", {
            method: "DELETE",
        });

        expect(res.status).toBe(404);
    });

    test("DELETE /documents/:filename — rejects non-.md filename", async () => {
        const res = await app.request("/documents/file.txt", {
            method: "DELETE",
        });

        expect(res.status).toBe(400);
    });
});
