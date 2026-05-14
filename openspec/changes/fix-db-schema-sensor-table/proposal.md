## Why
The core of the IoT telemetry processing relies on TimescaleDB for high-throughput, blazing-fast data ingestion and querying. Establishing a concrete and structured `telemetry` hypertable is crucial to resolve schema inconsistencies and ensure a solid foundation for all downstream microservices (Analytics, Ingestion, Intelligence).

## What Changes
- Creating a definitive `telemetry` table in PostgreSQL with columns: `time` (TIMESTAMPTZ), `device_id` (TEXT, default 'node01'), `soil_temperature` (DOUBLE PRECISION), `soil_humidity` (DOUBLE PRECISION), `env_temperature` (DOUBLE PRECISION), `env_humidity` (DOUBLE PRECISION), and `light_lux` (INTEGER).
- Ensuring the TimescaleDB extension is active.
- Converting the `telemetry` table into a TimescaleDB hypertable using the `time` primary partition.
- Aligning downstream dependent codebases (e.g., Ingestion Service, Analytic Service) to use the exact column names and 'telemetry' table name, phasing out previous assumptions (e.g., `telemetry`).

## Capabilities

### New Capabilities
- `telemetry-analytics`: Updating the read path to support querying data explicitly from the formalized `telemetry` table in the Analytic Service or other intelligence layers.

### Modified Capabilities
- `database-schema`: Updating the canonical timeseries table definition to precisely match the `telemetry` SQL declaration.
- `telemetry-ingestion`: Modifying the Data Ingestion service payload mapping and DB write execution statements to respect the updated `telemetry` schema and its defined column structure.

## Impact
- **Database Schema**: Applying migrations for the specific TimescaleDB table.
- **Ingestion Service**: Modifying the batch insert statement columns (`time`, `device_id`, `soil_temperature`, etc.) to align directly with the table.
- **Analytic Service & Queries**: Updating backend queries fetching historical sensor data and time-bucket aggregations to point to `telemetry` and parse the explicit column layout.
