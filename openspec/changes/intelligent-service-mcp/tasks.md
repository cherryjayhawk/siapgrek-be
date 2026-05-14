## 1. Setup and Dependencies

- [x] 1.1 Add required MCP and OpenAI dependencies to `services/intelligent-service/pyproject.toml` (e.g., `mcp`, `openai`, and any async HTTP clients like `httpx` if not already present).
- [x] 1.2 Update the `Dockerfile` for `intelligent-service` if any system-level dependencies are needed, and run `uv sync` or rebuild the container environment to ensure the new packages are successfully installed.

## 2. MCP Client Integration

- [x] 2.1 Create an MCP Client utility module at `services/intelligent-service/app/mcp_client.py` responsible for establishing the Server-Sent Events (SSE) connection to the `knowledge-service`.
- [x] 2.2 Implement a robust initialization sequence in `mcp_client.py` that fetches the list of available tools from the `knowledge-service` and dynamically maps them into a format compatible with OpenAI's function-calling schema.
- [x] 2.3 Implement error handling and graceful degradation within `mcp_client.py` to catch connection failures without crashing the application.

## 3. Insight Orchestration Logic

- [x] 3.1 Create an AI orchestration module at `services/intelligent-service/app/insights.py` to manage the OpenAI client and context chains.
- [x] 3.2 Implement a recursive tool-calling loop in `insights.py`. If the LLM requests a tool call (e.g. `disease_log`), the loop must proxy the call via the MCP client, append the JSON response to the conversation history, and re-query the LLM until a final answer is yielded.
- [x] 3.3 Create a base system prompt in `insights.py` that grounds the LLM as an expert orchid greenhouse assistant and correctly describes its available MCP tools to ensure accurate tool selection.

## 4. REST Endpoint API Implementation

- [x] 4.1 Define Pydantic request and response schemas in `services/intelligent-service/app/schemas.py` for the new internal insight endpoint (e.g., `InsightRequest` expecting a `query` string, and `InsightResponse` returning the answer).
- [x] 4.2 Add the `POST /api/v1/insights` route to the main FastAPI application in `services/intelligent-service/app/main.py`.
- [x] 4.3 Wire the `/api/v1/insights` route to asynchronously execute the `insights.py` orchestration logic, ensuring it properly awaits the result without blocking the asyncio event loop.
- [x] 4.4 Test the endpoint manually using the FastAPI Swagger UI (`/docs`). Validate that a question like "Are there any diseases?" correctly triggers the `disease_log` tool via MCP and returns a coherent natural language answer.
