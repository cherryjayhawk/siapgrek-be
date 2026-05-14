## Context

Currently, the Intelligent Service uses Redis Pub/Sub for triggering and communicating fuzzy logic evaluations. This architecture creates an unneeded side-channel in a system that already relies heavily on MQTT for edge device synchronization. To unify the message queue and maintain a single source of truth for events, the fuzzy logic engine should be refactored to listen directly to the MQTT broker for telemetry and publish commands back to MQTT.

Simultaneously, the Ingestion Service needs to capture these commands as they are broadcasted and store them in the `command_log` table so we have an exact historical audit of when fuzzy logic (or external actors) triggered an actuator.

## Goals / Non-Goals

**Goals:**
- Replace Redis Pub/Sub in the Intelligent Service with MQTT for the fuzzy logic loop.
- Filter out `ec` and `ph` from the telemetry payload during the fuzzy logic inference process.
- Actuate devices by publishing to `orchid/{device_id}/command/{actuator}`.
- Introduce `CommandLog` in the Prisma schema and migrate the database.
- Expand Ingestion Service to subscribe to `orchid/+/command/+` and persist the command payloads.

**Non-Goals:**
- Changing device behavior or TimescaleDB hypertable logic (standard Prisma is sufficient for command logs).
- Updating AI ML model endpoints (disease or anomaly detection).

## Decisions

1. **Intelligent Service Subscribes Directly to MQTT**
   *Rationale*: Eliminates the need for the Ingestion Service to dual-publish telemetry to Redis. The Intelligent Service acts as a standard MQTT client, subscribing to `orchid/+/telemetry`.
2. **`command_log` Table in Standard PostgreSQL / Prisma**
   *Rationale*: A standard Prisma model is sufficient, as command event throughput is relatively low compared to raw telemetry.
3. **Ingestion Service Logs Commands**
   *Rationale*: The Ingestion Service already has the role of saving MQTT streams to the database. Adding a subscription to `orchid/+/command/+` centralizes database write operations in a single worker.

## Risks / Trade-offs

- **[Risk] Double-Execution on Reconnect** → *Mitigation*: Ensure MQTT clients use QoS 1 with clean session handling so old retained messages do not trigger stale commands upon service restart.
- **[Risk] Command Spikes** → *Mitigation*: Insert commands individually or in small batches using Prisma to avoid DB locks.
