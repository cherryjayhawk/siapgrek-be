## ADDED Requirements

### Requirement: Redis Pub/Sub Configuration
The ingestion service SHALL connect to the configured Redis instance using a standard Redis client (`ioredis` or standard `redis`) and use it to publish real-time telemetry events.

#### Scenario: Configuring the publisher client
- **WHEN** the service starts up
- **THEN** it configures a connection to the Redis server
- **THEN** it prepares to publish events on the `telemetry:inserted` channel

### Requirement: Event Emission on Successful Immediate Insert
The system MUST emit an event on the Pub/Sub channel containing the exact details of the telemetry reading that was just successfully inserted into the database.

#### Scenario: Successful telemetry broadcast
- **WHEN** the single-row database insert query returns a success confirmation
- **THEN** the system serializes the validated telemetry payload into a JSON string
- **THEN** it publishes the serialized string to the `telemetry:inserted` Redis channel
- **THEN** the system logs the successful event dispatch at `debug` level

## REMOVED Requirements

### Requirement: BullMQ Job Queue Configuration
**Reason**: Replaced by lightweight Redis Pub/Sub to broadcast real-time events without queue overhead.
**Migration**: Remove BullMQ dependencies and the `anomalyQueue` instance.

### Requirement: Event Emission on Successful Batch Save
**Reason**: Replaced by immediate per-reading events.
**Migration**: Remove logic emitting batch boundary timestamps.
