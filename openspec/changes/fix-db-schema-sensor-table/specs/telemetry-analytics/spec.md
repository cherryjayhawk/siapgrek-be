## ADDED Requirements

### Requirement: Telemetry Analytics Querying
The system MUST support querying time-series data explicitly from the formalized `telemetry` table in the Analytic Service or other intelligence layers, addressing the formal column bindings (`time`, `device_id`, `soil_temperature`, `soil_humidity`, `env_temperature`, `env_humidity`, `light_lux`).

#### Scenario: Querying point-in-time sensor data
- **WHEN** the Analytic Service queries for historical sensor states
- **THEN** it executes a query targeting the `telemetry` table mapping onto the exact metrics columns
- **THEN** it handles potential NULL metric columns gracefully avoiding panic or parsing exceptions when constructing its JSON response
