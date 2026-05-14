## ADDED Requirements

### Requirement: Unified MQTT Fuzzy Logic Pipeline
The Intelligent Service MUST derive fuzzy logic inferences natively from MQTT logic without intermediate Redis Pub/Sub queues.

#### Scenario: Telemetry received for evaluation
- **WHEN** a payload arrives on the MQTT topic `orchid/+/telemetry`
- **THEN** the Intelligent Service unpacks the JSON payload
- **THEN** the Intelligent Service evaluates the sensor state using its fuzzy inference engine, explicitly ignoring `soil.ph` and `soil.ec`
- **THEN** the Intelligent Service publishes evaluating actions directly to `orchid/{device_id}/command/{actuator}` with a payload of `1` (ON) or `0` (OFF)

### Requirement: Command Logging via Ingestion
The Ingestion Service MUST intercept all actuator commands to capture a central audit log.

#### Scenario: Command intercepted
- **WHEN** ANY payload arrives on `orchid/+/command/+`
- **THEN** the Ingestion Service extracts `device_id`, `actuator`, and the binary payload
- **THEN** the Ingestion Service writes a new record to the `CommandLog` database table including a timestamp and action value
