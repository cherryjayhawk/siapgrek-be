## Context

Currently, the TimescaleDB `telemetry` hypertable only tracks `soil_temperature` and `soil_humidity` from the ESP32 soil sensor payload. To evaluate overall soil health and nutrient availability properly, the system requires tracking `ph` and `conductivity`. These new fields will be transmitted in the `soil` object of the MQTT telemetry payload.

## Goals / Non-Goals

**Goals:**
- Expand the TimescaleDB `telemetry` hypertable schema to include `soil_ph` and `soil_conductivity`.
- Update the `ingestion-service` validation and batch DB insert logic to correctly parse and store the new values.
- Update the `analytic-service` to expose `soil_ph` and `soil_conductivity` via the fast query endpoints.

**Non-Goals:**
- Updating the ESP32 edge device C++ code itself (this will be handled separately, the schema just needs to be ready to accept it).
- Immediately retraining the Intelligent Service's ML models to require these new features.

## Decisions

1. **Database Schema Expansion**: Add `soil_ph` (FLOAT) and `soil_conductivity` (FLOAT) columns directly to the `telemetry` hypertable.
   - *Rationale*: Keeping a flat column structure instead of migrating to JSONB for dynamic properties ensures maximum time-series query performance within TimescaleDB for aggregations.

2. **Payload Mapping**: The MQTT telemetry `soil` object will introduce `ph` and `conductivity`. The `ingestion-service` will map these to `soil_ph` and `soil_conductivity`.
   - *Rationale*: Consistency with existing flattening rules (e.g., `soil.temperature` mapped to `soil_temperature`).

3. **Optional Fields (Backward Compatibility)**: The validation schemas in the `ingestion-service` will mark `ph` and `conductivity` as optional. If omitted, `NULL` will be inserted.
   - *Rationale*: Older ESP32 nodes might not be immediately flashed. `NULL` explicitly indicates "no data" and prevents mathematical aggregation errors that would occur if we defaulted to `0.0` (as 0 is a valid measurement).

## Risks / Trade-offs

- [Risk] Legacy dashboards expecting exact schema properties might break. → Mitigation: Existing fields (`soil_temperature`, `soil_humidity`) remain untouched, ensuring backward compatibility.
- [Risk] If `ingestion-service` strictly validates incoming payloads and strictly requires the new fields, it will reject payloads from unflashed edge nodes. → Mitigation: Explicitly make `ph` and `conductivity` optional in the Zod/validation schema, inserting `NULL` if missing.
