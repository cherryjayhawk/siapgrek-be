## ADDED Requirements

### Requirement: Immediate Database Insertion
The system SHALL insert each validated telemetry reading directly into the TimescaleDB `telemetry` hypertable immediately upon receipt.

#### Scenario: Successful database insertion
- **WHEN** a valid telemetry payload is parsed and validated
- **THEN** the system executes a raw SQL INSERT for that single reading into the database
- **THEN** it waits for the query to return success before emitting downstream events

#### Scenario: Database insertion failure
- **WHEN** the SQL INSERT query fails
- **THEN** the system logs an ERROR with the payload details
- **THEN** the system gracefully drops the reading and continues processing subsequent MQTT messages without crashing

## REMOVED Requirements

### Requirement: In-Memory Batch Buffer
**Reason**: Replaced by immediate database insertion to eliminate latency.
**Migration**: Remove the `TelemetryBuffer` class and associated state from `ingestion-service`.

### Requirement: Batch Flush to Database
**Reason**: Replaced by immediate database insertion to eliminate latency.
**Migration**: Remove the 5-minute `setInterval` flush logic and bulk insert query.

### Requirement: Overload Protection
**Reason**: Buffer no longer exists, overload protection will be inherently handled by the database connection pool constraints.
**Migration**: Remove overflow callback logic.
