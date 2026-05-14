## 1. Database Configuration

- [x] 1.1 Update Prisma Schema: In `c:\dev\nodejs\siapgrek\database\prisma\schema.prisma` (or equivalent location), add the `InsightLog` model to store timestamp, user query, system response, token counts, and tool invocations.
- [x] 1.2 Apply Migration: Generate and apply the database migration so that the `insight_log` table is created in PostgreSQL.

## 2. Intelligent Service Python Logic

- [x] 2.1 Database Connection: Ensure the Python `intelligent-service` has an active asynchronous connection to PostgreSQL (e.g. via `asyncpg` or `SQLAlchemy`). If one does not exist, add it to `database.py` or `.env`.
- [x] 2.2 Response Metric Extraction: Modify the `c:\dev\nodejs\siapgrek\services\intelligent-service\app\insights.py` to correctly extract the metadata metrics (input tokens, output tokens, `tool_calls` string/JSON text) from the OpenAI LLM response.
- [x] 2.3 Background Persistence: In `insights.py`, utilize FastAPI's `BackgroundTasks` to inject the asynchronous log saving command immediately after the insight resolves. Test it to ensure it does not negatively impact request latency.
