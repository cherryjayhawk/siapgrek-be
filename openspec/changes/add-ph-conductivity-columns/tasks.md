## 1. Database Updates

- [x] 1.1 Run SQL `ALTER TABLE` on TimescaleDB `telemetry` to add `soil_ph` (FLOAT) and `soil_conductivity` (FLOAT) columns.
- [x] 1.2 Update the global Prisma schema (or corresponding database schema configuration files) to reflect the newly added `soil_ph` and `soil_conductivity` fields.

## 2. Ingestion Service Setup

- [x] 2.1 Update the MQTT payload input validation (Zod schemas) in `services/ingestion-service/src/` to include optional `ph` and `conductivity` fields inside the `soil` payload structure.
- [x] 2.2 Re-map the parsed payload logic in `services/ingestion-service/src/` to map `soil.ph` to `soil_ph` and `soil.conductivity` to `soil_conductivity`, inserting `NULL` if they are omitted.

## 3. Analytic Service Updates

- [x] 3.1 Modify the payload structs in `services/analytic-service/internal/handlers/telemetry.go` (or related model files) to include `SoilPh` (`soil_ph`) and `SoilConductivity` (`soil_conductivity`) as float fields.
- [x] 3.2 Update the SQL `SELECT` queries for historical data fetching inside `services/analytic-service/internal/handlers/telemetry.go` to explicitly retrieve `soil_ph` and `soil_conductivity`.

## 4. Intelligent Service Alignment

- [x] 4.1 Verify and update any active SQLAlchemy or Pydantic models in `services/intelligent-service/app/` if they natively select `*` from `telemetry`, ensuring they expect the entirely expanded schema.
