## Context

The system currently uses an async BullMQ worker in the `intelligent-service` to scan batch telemetry from the `ingestion-service` to identify anomalies using `.tflite` models. These anomalies are stored in an `anomaly_record` table and queried by the RAG feature through the `knowledge-service` MCP tool. To streamline the application architecture, we are removing the anomaly detection logic, reducing unneeded complexity and freeing up AI inference resources for fuzzy logic and disease classification.

## Goals / Non-Goals

**Goals:**
* Safely remove `.tflite` models and routers used for anomaly detection in the `intelligent-service`.
* Stop the background BullMQ worker processes that process telemetry batch events for anomaly detection.
* Remove MCP server implementations for the anomaly record tool in the `knowledge-service`.
* Remove the `anomaly_record` table from Prisma and PostgreSQL schemas.

**Non-Goals:**
* Making changes to telemetry ingestion parsing or the 10-second RS485 publish loops.
* Altering the existing disease classification implementation.
* Making architectural modifications to TimescaleDB beyond removing the relational table.

## Decisions

**1. Removing Background Inference Processing**
*Rationale*: By outright removing the worker and the TensorFlow Lite models associated with anomaly detection, we eliminate the primary CPU drain occurring asynchronously upon every telemetry batch save.
*Alternatives Considered*: Disabling it via configuration was less desirable because it leaves dead code and models in our container deployment.

**2. Clearing DB Schema**
*Rationale*: Completely removing the Prisma `anomaly_record` schema ensures the `knowledge-service` runs cleanly without useless types, and avoids database bloat. 

## Risks / Trade-offs

* **[Risk]** Unconsumed Redis Queues: If `ingestion-service` still publishes to a queue that nothing consumes, Redis memory might bloat. → **Mitigation**: Update `ingestion-service` publisher logic to not publish to the anomaly queue or remove the BullMQ publisher outright if anomaly scanning was its only consumer.
* **[Risk]** Prisma Type Errors: Removing `anomaly_record` can leave dead type references in `knowledge-service`. → **Mitigation**: Execute `npx prisma generate` and methodically scrub `/src` to ensure strict typing is restored.
