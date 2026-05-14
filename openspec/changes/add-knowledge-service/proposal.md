# Proposal

## Problem
The `intelligent-service` needs structured, domain-specific context to provide accurate natural language insights and evaluate agricultural environments. Currently, there is a gap in supplying custom domain knowledge (like specific greenhouse preferences) and bridging the gap between historical sensor/application data and the insight generation layer.

## Why
By centralizing knowledge retrieval into a dedicated `knowledge-service` via Model Context Protocol (MCP), the LLM layer can seamlessly ingest user-provided agricultural documentation, query historical sensor data, lookup past anamolies, and view disease logs without needing direct ad-hoc database integrations in the Python service. This creates a scalable context foundation, transforming raw system data and rules into actionable intelligence.

## Success Criteria
- [ ] A new Bun + TypeScript service (`knowledge-service`) is scaffolded and containerized via Docker.
- [ ] Provides an API to securely upload and store user-defined `.md` files for domain knowledge/preferences.
- [ ] Exposes 4 distinct MCP Servers (Tools):
  - **Preference**: Retrieves context from uploaded `.md` agricultural knowledge files.
  - **Sensor History**: Queries TimescaleDB for historical sensor readings.
  - **Disease Log**: Queries PostgreSQL for recorded plant disease classifications.
  - **Anomaly Record**: Queries PostgreSQL for detected environmental anomalies.
- [ ] The capabilities are successfully consumed by an MCP Client.

## Non-goals
- Implementing the actual Insight MCP Client or natural language inference (this happens in the `intelligent-service`).
- Advanced RAG vectorization (we will use file reading/MCP responses primarily, or basic parsing).
- Any modifications to hardware, analytics, or authentication mechanisms.

## Capabilties
- `knowledge-service-api`: Exposes REST endpoints for uploading/managing agricultural preference `.md` files.
- `knowledge-mcp`: Exposes 4 distinct MCP tools.

## Impact
- **New Service**: `services/knowledge-service/`
- **Docker Compose**: Added new `knowledge-service` container in the network.
- **Dependencies**: Depends on TimescaleDB/PostgreSQL for reading history and logs.
- **Consumers**: The `intelligent-service` will be the primary consumer of this MCP interface.
