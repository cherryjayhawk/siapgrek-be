## Why
The Intelligent Service needs to expose a natural language orchestration layer capable of providing personalized agricultural insights (via REST API) for the frontend application. This change connects the OpenAI LLM inside the `intelligent-service` as an MCP Client to interact dynamically with context-providing servers (like the `knowledge-service`), ensuring actionable end-user recommendations.

## What Changes
- Set up an MCP Client inside the `intelligent-service` (Python/FastAPI) to consume existing MCP tools from the `knowledge-service`.
- Integrate the OpenAI API using MCP capabilities.
- Develop system prompts and contextual orchestration chains to handle frontend REST queries effectively.
- Expose a REST API endpoint (e.g., `/api/v1/insights`) from the `intelligent-service` serving natural language AI recommendations.

## Capabilities

### New Capabilities
- `intelligent-insights`: Natural language insight generation via LLM and MCP integration.

### Modified Capabilities

## Non-goals
- Modifying the existing Fast API `disease-classification` or `anomaly-detection` internal ML prediction endpoints.
- Building the frontend UI components that consume this specific new REST endpoint.
- Supporting LLM providers other than OpenAI in this initial implementation.

## Impact
- **Code & Systems**: Adds an MCP orchestration loop and REST routes to `services/intelligent-service`.
- **APIs**: Exposes a new intelligent REST API endpoint for frontend web app consumption.
- **Dependencies**: Requires `mcp` (or similar SDK) and `openai` Python dependencies to be added to `services/intelligent-service/pyproject.toml`.
- **Infrastructure**: The `intelligent-service` will begin communicating with the `knowledge-service` via MCP protocols over the internal docker network.
