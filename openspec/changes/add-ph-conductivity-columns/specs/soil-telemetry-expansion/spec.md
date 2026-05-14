## ADDED Requirements

### Requirement: TimescaleDB schema supports pH and conductivity
The database schema MUST include `soil_ph` and `soil_conductivity` columns as FLOATs in the `telemetry` hypertable to store incoming electrical conductivity and pH measurements.

#### Scenario: Telemetry insertion
- **WHEN** the `ingestion-service` attempts to insert validated payload data containing soil pH and conductivity
- **THEN** the TimescaleDB `telemetry` hypertable successfully stores the data in the new `soil_ph` and `soil_conductivity` columns

### Requirement: Ingestion maps new metrics
The `ingestion-service` MUST extract `ph` and `conductivity` from the incoming MQTT telemetry `soil` object and prepare them for db insertion. If the fields are missing from the payload, it MUST map their values to NULL.

#### Scenario: Full soil payload received
- **WHEN** an MQTT payload arrives containing `soil: {"temperature": 24, "humidity": 70, "ph": 6.5, "conductivity": 1200}`
- **THEN** the `ingestion-service` extracts these values securely and inserts `6.5` into `soil_ph` and `1200` into `soil_conductivity`

#### Scenario: Partial soil payload received (backward compatibility)
- **WHEN** an older MQTT payload arrives without `ph` or `conductivity` defined in the `soil` JSON object
- **THEN** the `ingestion-service` accepts the payload without validation errors and prepares `NULL` for the `soil_ph` and `soil_conductivity` database fields

### Requirement: Analytic service exposes new metrics
The `analytic-service` MUST include the `soil_ph` and `soil_conductivity` fields when serving historical or aggregate sensor reads through its API endpoints.

#### Scenario: API data retrieval
- **WHEN** a client application queries the `analytic-service` for telemetry data
- **THEN** the API's JSON response correctly includes `soil_ph` and `soil_conductivity` metrics populated from the hypertable
