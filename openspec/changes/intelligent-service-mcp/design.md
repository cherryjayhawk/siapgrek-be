## Context

The `intelligent-service` acts as the Core AI inference layer for the Greenhouse Orchid IoT System. While the ML models (TensorFlow Lite) handle disease and anomaly classification natively, the system currently lacks a natural language orchestration layer capable of combining these disparate data points (history, diseases, user preferences constraints) into cohesive recommendations for the user.
The `knowledge-service` exposes these data points via the Model Context Protocol (MCP) servers. The `intelligent-service` needs an MCP client and an LLM integration (via OpenAI) to query these tools, reason over the returned context, and offer actionable insights back through a new REST endpoint.

## Goals / Non-Goals

**Goals:**
- Implement an MCP Client in FastAPI (`intelligent-service`) capable of connecting to `knowledge-service` via SSE (Server-Sent Events).
- Integrate OpenAI's client to handle conversational prompts augmented by the MCP tools.
- Implement `/api/v1/insights` REST endpoint serving a unified generation response.
- Ensure all MCP/OpenAI calls are fully asynchronous to prevent blocking the FastAPI server.

**Non-Goals:**
- Creating new MCP servers or adding new tools in the `knowledge-service`.
- Implementing frontend UI pages to display this AI chat overlay.
- Autonomous real-time actuation by the LLM (the LLM provides insights/recommendations only; deterministic fuzzy logic continues to handle edge actuation).

## Decisions

- **MCP Transport Protocol**: Since `knowledge-service` is a Bun server running in a separate container, the `intelligent-service` will connect via **SSE** over HTTP rather than `stdio`. 
  - *Rationale*: Microservices must remain decoupled. Using stdio requires placing both processes in the same container, violating the architectural fault isolation constraints.
- **LLM Provider**: OpenAI (`gpt-4o-mini` or `gpt-4o`).
  - *Rationale*: We need robust function-calling capabilities natively supported by OpenAI to easily bridge MCP tools into executable LLM functions.
- **Orchestration Flow**: The REST endpoint will accept user queries. The `intelligent-service` will interface with the OpenAI API, relying on native tool-use. When OpenAI requests a tool call, the `intelligent-service` proxies that request via MCP to the `knowledge-service`, returns the formatted result back to OpenAI, and finally yields the insight string back to the user via REST.

## Risks / Trade-offs

- **Latency / Performance**: Connecting to an external LLM (OpenAI) and orchestrating multiple MCP network roundtrips over HTTP (SSE) will introduce high latency (1-5+ seconds).
  - *Mitigation*: We will use native `async` and `await` with HTTPX for all REST and MCP transport calls to ensure the main FastAPI threadpool never blocks.
- **Knowledge Service Reliability / Network Failure**: If the `knowledge-service` crashes, the MCP tools will be inaccessible.
  - *Mitigation*: Wrap the MCP client initialization and tool calls in robust `try/except` blocks. If the tools fail, the LLM should gracefully degrade and simply state it cannot access current context, avoiding a 500 server crash.
