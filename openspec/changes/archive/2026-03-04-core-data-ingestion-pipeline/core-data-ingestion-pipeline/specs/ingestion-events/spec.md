## ADDED Requirements

### Requirement: BullMQ Job Queue Configuration
The ingestion service SHALL initialize a BullMQ producer connected to the specified Redis backend upon startup.

#### Scenario: Configuring the publisher
- **WHEN** the service starts up
- **THEN** it configures a connection to the Redis server
- **THEN** it establishes a BullMQ Queue titled `anomaly-detection`

### Requirement: Event Emission on Successful Batch Save
The system MUST emit an event containing the time boundaries of the successfully persisted batch so that downstream systems can trigger operations like anomaly detection.

#### Scenario: Successful emission
- **WHEN** the 5-minute bulk insert query returns a success confirmation from TimescaleDB
- **THEN** the system calculates the start and end timestamp of the data batch it just saved
- **THEN** it adds a job to the `anomaly-detection` BullMQ queue containing those timestamps as payload
- **THEN** the system logs the successful event dispatch

### Requirement: Error Handling for Queue Failures
The system SHALL attempt robust handling if the event fails to emit, but MUST NOT crash the main telemetry ingestion pipeline.

#### Scenario: Redis connection failure during emission
- **WHEN** the bulk insert succeeds but adding the job to BullMQ throws a connection error
- **THEN** the system logs the Redis failure as an ERROR
- **THEN** the system continues to accept telemetry and waits for the next 5-minute interval without crashing
