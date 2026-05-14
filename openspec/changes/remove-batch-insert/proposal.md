## Why

The current ingestion-service buffers MQTT telemetry payloads in memory and performs a bulk insert every 5 minutes. This introduces a 5-minute latency between when data is received and when it is available in the database and downstream systems. To enable real-time analytics and immediate anomaly detection, we need to remove the batching mechanism and insert each telemetry payload into the database immediately upon arrival.

## What Changes

- **BREAKING**: Remove the 5-minute in-memory batch buffer in `ingestion-service`.
- **BREAKING**: Remove the 5-minute scheduled bulk insert into TimescaleDB.
- Change the database insertion strategy to immediately insert telemetry data upon receiving a valid MQTT payload.
- Transition event emission from a 5-minute BullMQ batch job to immediate Redis Pub/Sub events that fire for each individual telemetry payload.

## Capabilities

### New Capabilities
<!-- No new capabilities, just modifications to existing ones -->

### Modified Capabilities
- `telemetry-ingestion`: Remove "In-Memory Batch Buffer", "Batch Flush to Database", and "Overload Protection" requirements. Introduce requirement for "Immediate Database Insertion".
- `ingestion-events`: Change "BullMQ Job Queue Configuration" to "Redis Pub/Sub Configuration". Change "Event Emission on Successful Batch Save" to "Event Emission on Successful Immediate Insert".

## Impact

- **`ingestion-service`**: Core logic for handling incoming MQTT messages will be simplified (no buffering state). Database connection pool may experience higher frequency of smaller transactions.
- **`intelligent-service` / downstream workers**: Will receive streams of individual telemetry events via Redis Pub/Sub instead of bulk updates every 5 minutes.
- **Database**: Increased number of `INSERT` queries per minute, relying on TimescaleDB's ability to handle high insert rates.
