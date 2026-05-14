## ADDED Requirements

### Requirement: MQTT Subscription
The ingestion service SHALL connect to the configured MQTT broker and subscribe to the telemetry topic pattern.

#### Scenario: Successful connection and subscription
- **WHEN** the service starts up
- **THEN** it connects to the MQTT broker using configured credentials
- **THEN** it subscribes to the topic `orchid/+/telemetry`

### Requirement: Telemetry Payload Validation
The system SHALL validate all incoming telemetry payloads against the expected JSON schema using Zod before any processing occurs.

#### Scenario: Valid telemetry payload received
- **WHEN** a payload matching the strict `{ soil, environment, light, timestamp }` schema is received
- **THEN** the system parses the JSON
- **THEN** the system adds the validated reading to the in-memory batch buffer

#### Scenario: Invalid telemetry payload received
- **WHEN** a payload with missing fields or incorrect types is received
- **THEN** the system logs a validation error with the specific device ID
- **THEN** the system gracefully discards the payload without crashing

### Requirement: In-Memory Batch Buffer
The system SHALL store validated telemetry readings in an in-memory buffer to dramatically reduce database I/O, rather than inserting individual readings.

#### Scenario: Filling the buffer
- **WHEN** valid telemetry is received
- **THEN** the system appends the structural data along with the origin `device_id` parsed from the MQTT topic to the memory buffer array

### Requirement: Batch Flush to Database
The system SHALL perform a bulk insert operation into the TimescaleDB `telemetry` hypertable every 5 minutes containing all buffered readings.

#### Scenario: Scheduled interval reached
- **WHEN** the 5-minute timer triggers
- **THEN** the system copies the current buffer and resets the primary buffer to empty
- **THEN** the system performs a bulk INSERT into TimescaleDB with the copied buffer data
- **THEN** the system handles the database transaction idempotently

### Requirement: Overload Protection
The system MUST implement a maximum capacity for the in-memory buffer to prevent Out-Of-Memory (OOM) crashes under extreme load.

#### Scenario: Buffer limit exceeded
- **WHEN** the in-memory buffer reaches its predefined capacity upper limit (e.g., 50,000 readings) before the 5-minute timer triggers
- **THEN** the system SHALL immediately execute the bulk INSERT operation to flush the buffer early
- **THEN** the system resets the 5-minute timer
