import { Hono } from "hono";
import { join } from "path";
import { readdir, unlink, stat } from "fs/promises";

const DOCS_DIR = join(process.cwd(), "docs");

const documents = new Hono();

// -----------------------------------------------
// POST /upload — Upload a .md file
// -----------------------------------------------
documents.post("/upload", async (c) => {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
        return c.json({ error: "Missing 'file' field in multipart body" }, 400);
    }

    if (!file.name.endsWith(".md")) {
        return c.json({ error: "Only .md files are allowed" }, 400);
    }

    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = join(DOCS_DIR, filename);
    const content = await file.text();

    await Bun.write(filePath, content);

    return c.json({
        message: "File uploaded successfully",
        filename,
    }, 201);
});

// -----------------------------------------------
// GET /documents — List uploaded documents
// -----------------------------------------------
documents.get("/", async (c) => {
    const files = await readdir(DOCS_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const results = await Promise.all(
        mdFiles.map(async (name) => {
            const filePath = join(DOCS_DIR, name);
            const info = await stat(filePath);
            return {
                filename: name,
                size: info.size,
                uploadedAt: info.mtime.toISOString(),
            };
        }),
    );

    return c.json({ documents: results });
});

// -----------------------------------------------
// DELETE /documents/:filename — Delete a document
// -----------------------------------------------
documents.delete("/:filename", async (c) => {
    const filename = c.req.param("filename");

    if (!filename.endsWith(".md")) {
        return c.json({ error: "Only .md files can be deleted" }, 400);
    }

    const filePath = join(DOCS_DIR, filename);

    try {
        await unlink(filePath);
        return c.json({ message: `Deleted ${filename}` });
    } catch {
        return c.json({ error: "File not found" }, 404);
    }
});

export { documents };
