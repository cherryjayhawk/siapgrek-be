## Context

The Knowledge Service acts as the MCP (Model Context Protocol) tool provider for the Intelligent Service. Currently, it provides tools for historical sensor data, preference documents, disease logs, and anomaly records. 
To improve real-time reasoning, the LLM needs immediate condition context (latest sensor data) and external weather context (OpenWeatherMap). Meanwhile, anomaly records have proven less relevant or redundant for direct LLM querying in this context, so the `anomaly_record` tool will be removed.

## Goals / Non-Goals

**Goals:**
- Provide a `weather_forecast` MCP tool that takes `lat` and `lon` as input and returns OpenWeatherMap data.
- Provide a `latest_sensor_data` MCP tool that returns the absolute latest telemetry reading for a given `device_id`.
- Remove the `anomaly_record` tool to clean up the MCP toolset.

**Non-Goals:**
- Refactoring the entire database connection logic.
- Building an overarching weather caching service (the LLM can just fetch it live when asked since the volume of MCP queries is low).

## Decisions

1. **Use Bun Native `fetch` for OpenWeatherMap**
   *Rationale:* Bun has highly optimized built-in `fetch`. Adding external HTTP libraries like `axios` is unnecessary overhead. The OpenWeatherMap API key will be managed via the runtime environment (`.env`).
2. **Direct DB Query for Latest Sensor Data**
   *Rationale:* While the `Analytic Service` normally handles high-speed dashboard reads, the MCP tool requests from the LLM are very low frequency. Given the `Knowledge Service` already holds a TimescaleDB connection pool (`getPool`), it is far simpler and perfectly performant to just execute `SELECT * FROM telemetry ORDER BY "timestamp" DESC LIMIT 1`. This avoids an extra inter-service HTTP hop.
3. **Remove `anomaly_record` Tool entirely**
   *Rationale:* The AI pipeline no longer requires this tool for context gathering during natural language sessions.

## Risks / Trade-offs

- **[Risk] OpenWeatherMap Rate Limits** → *Mitigation:* The Intelligent Service (LLM) only calls this tool when explicitly requested or necessary. We accept the risk since LLM operations are generally low-volume compared to raw telemetry ingestion.
- **[Risk] Missing API Key** → *Mitigation:* The tool will gracefully return a friendly error string to the LLM if the `OPENWEATHERMAP_API_KEY` is not configured, rather than crashing the Knowledge Service.
