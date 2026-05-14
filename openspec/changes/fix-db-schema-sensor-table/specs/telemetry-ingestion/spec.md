## MODIFIED Requirements

### Requirement: Batch Flush to Database
The system SHALL perform a bulk insert operation explicitly into the `telemetry` hypertable every 5 minutes containing all buffered readings mapped to the correct formal columns (`time`, `device_id`, `soil_temperature`, `soil_humidity`, `env_temperature`, `env_humidity`, `light_lux`).

#### Scenario: Scheduled interval reached
- **WHEN** the 5-minute timer triggers
- **THEN** the system copies the current buffer and resets the primary buffer to empty
- **THEN** the system performs a bulk INSERT into the TimescaleDB `telemetry` table correctly assigning nullable columns metrics derived from the buffered data
- **THEN** the system handles the database transaction idempotently
