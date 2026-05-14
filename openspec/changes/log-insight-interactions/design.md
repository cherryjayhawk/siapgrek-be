## Context

The Intelligent Service serves a natural language `/insights` endpoint which leverages an OpenAI LLM and Model Context Protocol (MCP) servers to deliver intelligent insights to the user. Currently, these interactions are ephemeral: the insight is generated and returned synchronously via REST API, but it is not permanently logged in the database.
To improve auditability, trace token consumption, and verify the accuracy of the tools invoked, we need a mechanism to securely persist the execution footprint of each interaction.

## Goals / Non-Goals

**Goals:**
- Record essential interaction details (user query, final response, tools used, token metrics).
- Implement a Prisma migration in the `database` service to support these logs.
- Add async logging code inside the Python FastAPI `intelligent-service` without causing noticeable latency overhead.

**Non-Goals:**
- Adding pagination, search endpoints, or an admin UI to query the logs (out of scope for this change).
- Throttling user requests based on actual token costs.

## Decisions

1. **Database Integration for Intelligent Service**
   - *Decision:* Have the Python Intelligent service use `asyncpg` or a quick HTTP call to `knowledge-service`/`analytic-service`? Actually, it's best to keep the API minimal. The other services are TS-based. To avoid giving direct DB write access to Python (which might conflict with Prisma schema validations), we will create a lightweight internal POST endpoint in a TypeScript service (e.g., `knowledge-service` or `ingestion-service`) OR just have Python write directly using `asyncpg`. Given the existing layout, Python doesn't usually use Prisma. 
   - *Alternative:* Since there is an `analytic-service`/`knowledge-service`, maybe we just insert it via Prisma in one of the Node/Bun servers? Often Python microservices directly write to the DB using `SQLAlchemy`. Let's assume we implement a direct async insert using the existing async DB connection in FastAPI.
   - *Decision for Logging approach:* Use FastAPI `BackgroundTasks` to perform the database insert asynchronously after the REST response is returned.

2. **Schema Design**
   - Details: Add an `InsightLog` model to `schema.prisma`.
   - Fields: `id` (String UUID), `timestamp` (DateTime), `user_query` (Text), `system_response` (Text), `input_tokens` (Int), `output_tokens` (Int), `tools_called` (JSON).

## Risks / Trade-offs

- **[Risk] High volume of long text strings causing database bloat.**
  - *Mitigation:* Ensure `user_query` and `system_response` are stored as straightforward `TEXT` fields. If space becomes an issue, older logs can be archived.
- **[Risk] Sync API blocking.**
  - *Mitigation:* By utilizing FastAPI's `BackgroundTasks`, the HTTP thread is freed to return the successful response to the frontend client while the Postgres `INSERT` runs seamlessly in the background.
