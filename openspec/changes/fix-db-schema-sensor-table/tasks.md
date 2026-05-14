## 1. Database Schema Execution

- [x] 1.1 Execute TimescaleDB schema migration
  * **File:** `database/init.sql` (or equivalent initialization script)
  * **Action:** Insert the raw SQL defining the `telemetry` table (`time` TIMESTAMPTZ NOT NULL, `device_id` TEXT NOT NULL DEFAULT 'node01', `soil_temperature` DOUBLE PRECISION, `soil_humidity` DOUBLE PRECISION, `env_temperature` DOUBLE PRECISION, `env_humidity` DOUBLE PRECISION, `light_lux` INTEGER).
  * **Action:** Ensure the `timescaledb` extension is created and call `SELECT create_hypertable('telemetry', 'time');`.
  * **Acceptance Criteria:** Connecting to TimescaleDB executing `\d telemetry` correctly displays the columns, and `select * from timescaledb_information.hypertables;` shows `telemetry`.

## 2. Ingestion Service Updates

- [x] 2.1 Update Zod validation schema
  * **File:** `services/ingestion-service/src/schema.ts` (or wherever validation lives)
  * **Action:** Ensure the payload maps clearly to the conceptual domains, but document the mapping to specific SQL columns for subsequent batch saves.
  * **Acceptance Criteria:** JSON payloads with the shape `{ soil: {temperature, humidity}, environment: {temperature, humidity}, light: {lux}, timestamp }` validate successfully.
- [x] 2.2 Update timeseries batch insert logic
  * **File:** `services/ingestion-service/src/db.ts` (or wherever the TimescaleDB insertion routine runs)
  * **Action:** Update the bulk `INSERT` query from old schemas (like `telemetry`) to explicitly target `telemetry`.
  * **Action:** Map the incoming payload explicitly to `(time, device_id, soil_temperature, soil_humidity, env_temperature, env_humidity, light_lux)`.
  * **Acceptance Criteria:** When the 5-minute timer hits, the service correctly pushes data into TimescaleDB and no parsing/column-missing errors are thrown.

## 3. Analytic Service Updates

- [x] 3.1 Update Go struct definitions
  * **File:** `services/analytic-service/models/telemetry.go` (or equivalent)
  * **Action:** Update the telemetry domain struct `db:"soil_temperature"`, etc. focusing on nullable pointer types (`*float64`, `*int`) to account for timeseries missing data.
  * **Acceptance Criteria:** Struct accurately mirrors the new db layout.
- [x] 3.2 Update read query execution
  * **File:** `services/analytic-service/main.go` (or specific repository module fetching history)
  * **Action:** Update SELECT statements targeting history data to pull from the `telemetry` table instead of old names.
  * **Acceptance Criteria:** API endpoints returning history data succeed without internal column mismatch errors.

## 4. Intelligent Service Updates

- [x] 4.1 Update anomaly detection workers
  * **File:** `services/intelligent-service/app/worker.py` (or Python db query functions)
  * **Action:** Any async retrieval or checking of sensor telemetry prior to running `.tflite` inference needs its SQL `SELECT` string updated to `telemetry` with the new columns.
  * **Acceptance Criteria:** The BullMQ Python worker executes successfully against the updated TimescaleDB without SQL syntax or missing column errors.
