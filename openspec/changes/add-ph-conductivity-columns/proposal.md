## Why

Currently, the system's telemetry data only tracks temperature and humidity for the soil environment. To capture a more comprehensive picture of soil health and nutrient availability, we need to monitor soil pH and conductivity. This enables more precise agricultural insights and improves the anomaly detection and intelligent control logic.

## What Changes

- **Database Schema**: Add `soil_ph` (FLOAT) and `soil_conductivity` (FLOAT) columns to the TimescaleDB `telemetry` hypertable.
- **MQTT Payload**: Assume the `soil` object in the telemetry JSON will now include `ph` and `conductivity`.
- **Ingestion Service**: Update MQTT parsing and the bulk DB insertion logic (Bun/TypeScript) to handle the new soil fields.
- **Analytic Service**: Update the API queries in `telemetry.go` (Go/Fiber) to return `soil_ph` and `soil_conductivity`.
- **Intelligent Service**: Update the database models/feature processing (Python/FastAPI) to recognize the new columns if applicable.

## Capabilities

### New Capabilities
- `soil-telemetry-expansion`: Expanding the basic soil telemetry payload and database schema to include pH and electrical conductivity.

### Modified Capabilities


## Impact

- **Database**: Migration required for the TimescaleDB hypertable `telemetry`.
- **Edge Layer**: ESP32 microcontrollers must be updated to send `ph` and `conductivity` under the `soil` object in their MQTT telemetry payload.
- **Backend Services**: Ingestion, Analytic, and potentially Intelligent services require struct/model updates to handle the new columns correctly.
