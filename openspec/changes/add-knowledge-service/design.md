## Context

The system needs to provide an AI layer (`intelligent-service`) with structured, domain-specific agricultural knowledge, user preferences, and historical data context. Without a dedicated knowledge provider, the `intelligent-service` would need to couple directly with the database and handle file parsing itself, breaking the separation of concerns and scaling poorly. We will introduce a new microservice (`knowledge-service`) to act as the central knowledge and context provider using the Model Context Protocol (MCP).

## Goals / Non-Goals

**Goals:**
- Implement a Bun-based `knowledge-service` that exposes an API for uploading agricultural `.md` docs.
- Expose an MCP Server that provides 4 distinct tools: Preference retrieval from uploaded `.md` docs, Sensor History retrieval, Disease Log retrieval, and Anomaly Record retrieval.
- Seamlessly integrate with TimescaleDB and PostgreSQL for historical lookups.

**Non-Goals:**
- Implementing the AI agent (MCP Client) which consumes these tools; this is deferred to the `intelligent-service` phase.
- Vector database integration for RAG. We will rely on simple document loading and context window limits for now.
- Authorization mechanism specific to the MCP server.

## Decisions

- **Bun + TypeScript for `knowledge-service`**: Bun provides excellent performance for I/O operations and API serving, making it ideal for reading files and querying the database rapidly compared to Node.js.
- **Model Context Protocol (MCP)**: Chosen over custom REST endpoints for AI context retrieval. MCP provides a standardized way for LLM clients to dynamically discover and use tools without hardcoded integration logic at the AI layer.
- **Direct Database Queries for Context**: The MCP server will query TimescaleDB/PostgreSQL directly via a standard SQL client (e.g., `postgres.js` or `pg`) to fetch sensor history and logs, rather than communicating with the `analytic-service` via REST. This avoids HTTP overhead for background AI operations.

## Risks / Trade-offs

- **Context Window Overload** -> Mitigation: Ensure the MCP tools accept parameters (e.g., date ranges, limit counts) to constrain the amount of history/logs returned to the LLM.
- **File Storage Management** -> Mitigation: Uploaded `.md` files will be stored in a local mounted volume or simple directory within the container for now, with strict validation on file types.
