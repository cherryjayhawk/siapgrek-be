## Why

The Core Data Ingestion Pipeline is required to reliably and efficiently capture high-throughput continuous sensor readings from the ESP32 edge nodes. By subscribing to MQTT payloads and batch-inserting them into TimescaleDB every 5 minutes, we avoid database I/O bottlenecks and ensure the system can handle large streams of telemetry without data loss. Furthermore, this pipeline establishes the asynchronous event foundation for downstream AI services to react to new data via BullMQ.

## What Changes

- Create the `ingestion-service` utilizing Bun and TypeScript.
- Implement an MQTT consumer to subscribe to `orchid/+/telemetry` topics.
- Validate and sanitize incoming JSON telemetry payloads against a defined schema.
- Implement an in-memory batching mechanism that flushes payload data to the `telemetry` TimescaleDB hypertable at 5-minute intervals.
- Integrate BullMQ as a publisher to emit processing events upon successful batch saves, decoupling data ingestion from anomaly detection.

## Capabilities

### New Capabilities
- `telemetry-ingestion`: Manages continuous MQTT subscription, incoming payload validation, robust memory buffering, and TimescaleDB batch insertion operations.
- `ingestion-events`: Manages the emission of BullMQ events to Redis, notifying downstream services that fresh batch data has been persisted and is ready for tasks like anomaly detection.

### Modified Capabilities


## Impact

- **Database**: Introduces high-throughput write operations to the `telemetry` Hypertable within TimescaleDB.
- **Message Broker**: Establishes a permanent consumer connection to the Mosquitto MQTT broker.
- **Event Queue**: Introduces BullMQ producer logic relying on the Redis infrastructure.
- **Architecture**: Decouples the fast ingestion of data from the potentially slow ML anomaly detection processing.

## Non-goals

- Implementing the anomaly detection logic or models (handled by the `intelligent-service`).
- Implementing fuzzy logic or automated actuator control based on incoming data.
- Establishing read endpoints or APIs for the ingested data (handled by the `analytic-service`).
