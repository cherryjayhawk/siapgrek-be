## 1. Project Setup & Docker Configuration

- [x] 1.1 Scaffold `knowledge-service`
  - **Action:** Initialize a Bun project with `package.json` and `tsconfig.json`. Add dependencies: `hono`, `@modelcontextprotocol/sdk`, and `postgres`.
  - **Targets:** `services/knowledge-service/package.json`, `services/knowledge-service/tsconfig.json`
  - **Acceptance Criteria:** Packages install successfully and TypeScript compiles an empty source file.

- [x] 1.2 Configure Docker Environment
  - **Action:** Create `Dockerfile` for `knowledge-service` and append the service to the root `docker-compose.yml`. Mount a volume `./services/knowledge-service/docs:/app/docs` for markdown storage.
  - **Targets:** `services/knowledge-service/Dockerfile`, `docker-compose.yml`
  - **Acceptance Criteria:** Running `docker-compose up` successfully spins up the `knowledge-service` alongside `timescaledb` and other infrastructure containers.

## 2. Document Management API Implementation

- [x] 2.1 Implement Hono Router & Upload Endpoint
  - **Action:** Setup Hono in `src/index.ts`. Create an endpoint `POST /upload` that validates file extension (`.md`), parses `multipart/form-data`, and saves the file to the local `docs/` directory.
  - **Targets:** `services/knowledge-service/src/index.ts`, `services/knowledge-service/src/routes/documents.ts`
  - **Acceptance Criteria:** `POST /upload` accepts only `.md` files and properly saves them on disk. Returns `400` for invalid types.

- [x] 2.2 Implement Management Endpoints (List & Delete)
  - **Action:** Create `GET /documents` to list uploaded markdown files and `DELETE /documents/:filename` to remove a file from the disk.
  - **Targets:** `services/knowledge-service/src/routes/documents.ts`
  - **Acceptance Criteria:** Endpoints correctly reflect the state of the `docs/` folder and successfully remove files from the OS.

## 3. Database Connection & Helper Layer

- [x] 3.1 Setup Connection Pool
  - **Action:** Create a Postgres client setup in `db.ts` referencing the shared `DATABASE_URL` environment variable to talk to TimescaleDB.
  - **Targets:** `services/knowledge-service/src/lib/db.ts`
  - **Acceptance Criteria:** Service successfully connects to the database on boot without error.

## 4. MCP Servers Implementation

- [x] 4.1 Initialize MCP SDK and Transport Layer
  - **Action:** Create the base MCP Server instance and expose it over an HTTP SSE transport or stdio. For this architecture, an HTTP SSE endpoint (e.g., `/mcp`) attached to the Hono router is appropriate.
  - **Targets:** `services/knowledge-service/src/mcp/server.ts`, `services/knowledge-service/src/index.ts`
  - **Acceptance Criteria:** MCP Client can successfully connect to the exposed MCP endpoint and perform a list tools request.

- [x] 4.2 Implement `preference` tool
  - **Action:** Register the `preference` tool. The tool handler should read all `.md` files in the `docs/` folder and return concatenated text/context.
  - **Targets:** `services/knowledge-service/src/mcp/tools.ts`
  - **Acceptance Criteria:** The `preference` tool correctly echoes the content of the markdown files via MCP protocol.

- [x] 4.3 Implement `sensor_history` tool
  - **Action:** Register the `sensor_history` tool. Accept input parameters (time range, limit). Write SQL to query the `telemetry` table in TimescaleDB and format the result into text.
  - **Targets:** `services/knowledge-service/src/mcp/tools.ts`
  - **Acceptance Criteria:** Tool correctly queries the actual `telemetry` hypertable and returns aggregated history.

- [x] 4.4 Implement `disease_log` and `anomaly_record` tools
  - **Action:** Register both tools. Query the `disease_log` and `anomaly_record` PostgreSQL tables to fetch past events based on device ID or recent timestamps.
  - **Targets:** `services/knowledge-service/src/mcp/tools.ts`
  - **Acceptance Criteria:** Tool successfully queries and formats the rows into readable insights for the LLM.

## 5. Testing and Validation

- [x] 5.1 Write API and unit tests
  - **Action:** Add Bun's native test runner tests to verify file upload restrictions, file deletion, and database query formatting.
  - **Targets:** `services/knowledge-service/tests/api.test.ts`, `services/knowledge-service/tests/mcp.test.ts`
  - **Acceptance Criteria:** `bun test` passes successfully in the service directory covering the routes and queries.
