## Why

Anomaly detection is being removed from the project. This simplifies the architectural complexity, removing the need for BullMQ workers that parse `ingestion-service` batch events, and deleting the corresponding API endpoints, tflite models, and MCP tools in the `intelligent-service` and `knowledge-service`.

## What Changes

* **Remove Anomaly Detection ML Worker**: Remove the background BullMQ worker in the `intelligent-service` that scans telemetry batches for anomalies.
* **Remove Anomaly Detection APIs**: Remove the manual anomaly detection endpoint in the `intelligent-service`.
* **Remove Anomaly Record MCP Tool**: Remove the anomaly record tool from the `knowledge-service` so the LLM no longer attempts to query it.
* **Remove Database Schema Elements**: Remove the `anomaly_record` table and Prisma schema definitions.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `database-schema`: Remove the `anomaly_record` table definitions.
- `ingestion-events`: Remove the anomaly detection consumer expectations.

## Impact

* **intelligent-service**: FastAPI routes for anomalies, BullMQ anomaly workers, and `.tflite` model references will be removed.
* **knowledge-service**: MCP anomaly tools, Prisma schema, and DB query endpoints will be removed.

## Non-goals

* We are not removing the **disease classification** capability.
* We are not removing **fuzzy logic actuation** or **telemetry ingestion**.
