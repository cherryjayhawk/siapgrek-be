## Context

The `ingestion-service` currently receives MQTT telemetry payloads, buffers them in memory using a `TelemetryBuffer`, and performs a bulk insert to TimescaleDB every 5 minutes. It then emits a BullMQ job that notifies downstream services (like `intelligent-service`) about the newly saved batch. While this was designed to protect the database from high I/O, the 5-minute latency delays real-time anomaly detection and reactive actuations.

## Goals / Non-Goals

**Goals:**
- Insert MQTT telemetry into TimescaleDB immediately upon receiving a valid payload.
- Emit Redis Pub/Sub events for each individual inserted reading, replacing the 5-minute batch notification.
- Simplify the internal state of `ingestion-service` by removing the in-memory buffer and scheduler.

**Non-Goals:**
- Changing the schema of the TimescaleDB `telemetry` hypertable.
- Replacing Zod schema validation for incoming MQTT payloads.
- Modifying the downstream `intelligent-service` logic beyond adapting it to consume individual Redis Pub/Sub events instead of BullMQ batch jobs.

## Decisions

1. **Remove In-Memory Buffer and Timer**:
   - *Alternative*: Reduce the buffer interval to 1 second.
   - *Rationale*: TimescaleDB is highly optimized for time-series ingestion and can easily handle individual inserts at our current scale without buffering. Removing the buffer entirely simplifies the codebase, eliminates the risk of memory leaks or data loss on container crash, and achieves true real-time latency.

2. **Immediate DB Insert via Raw SQL**:
   - *Alternative*: Use an ORM like Prisma.
   - *Rationale*: We are already using `postgres.js` for raw SQL inserts in `db/repository.ts`. Retaining `postgres.js` for single-row inserts ensures maximum performance and avoids adding unnecessary abstraction layers or ORMs into this specific high-throughput service.

3. **Transition from BullMQ to Redis Pub/Sub**:
   - *Alternative*: Maintain BullMQ but push every single reading as a job.
   - *Rationale*: BullMQ is an overkill task queue for simple real-time event broadcasting and would incur high overhead if enqueuing a job per telemetry reading. Redis Pub/Sub provides a lightweight, fire-and-forget message broker mechanism that is ideal for streaming real-time metrics to decoupled worker services.

## Risks / Trade-offs

- **[Risk] Increased DB Connection Load** → The database will see many small `INSERT` queries instead of one large query. *Mitigation*: Ensure `postgres.js` is configured with an adequate connection pool size to handle concurrent ingestion spikes.
- **[Risk] Redis Pub/Sub Data Loss** → Unlike BullMQ, Redis Pub/Sub is fire-and-forget. If a downstream service is restarting, it will miss the event. *Mitigation*: Downstream services that require guaranteed processing can query TimescaleDB directly for recent data upon starting up, using the real-time stream only for immediate reactions.
