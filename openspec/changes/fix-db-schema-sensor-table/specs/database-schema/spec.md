## ADDED Requirements

### Requirement: Essential Telemetry Hypertable
The database MUST instantiate a definitive `telemetry` table configured strictly for high-throughput time-series sensor ingestion logic.

#### Scenario: Running database initializations for time-series data
- **WHEN** the TimescaleDB postgres sequence executes
- **THEN** a table named `telemetry` is created with nullable metric columns (`soil_temperature`, `soil_humidity`, `env_temperature`, `env_humidity`, `light_lux`) and non-nullable `time` (TIMESTAMPTZ) and `device_id` (TEXT)
- **THEN** the TimescaleDB `create_hypertable()` structure is applied over the primary table partition column `time`
