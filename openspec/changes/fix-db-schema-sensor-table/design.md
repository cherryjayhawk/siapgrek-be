## Context

The system currently experiences inconsistencies across service boundaries (Ingestion, Analytic, AI reasoning) due to an informally declared timescale table for telemetry input. This leads to brittle parsing logic and potential errors querying the data. TimescaleDB is integral as it manages the large volumes of structured logs written every 5 minutes by the Ingestion pipeline. We need to formalize the database initialization sequence to implement an idempotent `telemetry` hypertable structure ensuring all components share identical properties, particularly separating `soil_temperature`/`soil_humidity` from `env_temperature`/`env_humidity` and unifying parsing routines.

## Goals / Non-Goals

**Goals:**
- Migrate or instantiate the primary time-series telemetry table under the explicit name `telemetry`.
- Ensure column naming perfectly mirrors the explicit schema request (`time`, `device_id`, `soil_temperature`, `soil_humidity`, `env_temperature`, `env_humidity`, `light_lux`).
- Apply the TimescaleDB `create_hypertable` initialization on the `time` parameter correctly.
- Ensure the data ingestion payload mapping conforms strictly to these columns prior to 5-minute batch insert operations.

**Non-Goals:**
- Overhauling the AI ML model inferencing structure or fuzzy rules base.
- Altering any frontend components directly (they will be shielded by standardized Analytic API payloads).
- Adding new Modbus hardware nodes; we are strictly optimizing the storage data layer.

## Decisions

**Decision 1: Direct SQL definition in database initialization scripts**
- *Rationale*: We will apply the explicit telemetry schema via raw SQL structure setup or Timescale-native migrations rather than relying strictly on an ORM for the hypertable logic. This ensures accurate hypertable partitioning on `time` that standard ORMs struggle to natively compile.
- *Alternatives considered*: Managing TimescaleDB schemas strictly inside Prisma migrations. Rejected due to operational mismatch, specifically setting up the Timescale extension and `create_hypertable` directives successfully via Prisma schema.

**Decision 2: Nullable fields for sensor values**
- *Rationale*: All measurement columns (`DOUBLE PRECISION` or `INTEGER`) exclude the `NOT NULL` constraint (except `time` and `device_id`). This handles scenarios where an individual sensor (e.g., ambient DHT22) goes offline but the soil moisture sensor continues to transmit successfully. The ingestion batch can insert partial records, ensuring partial data persistence.
- *Alternatives considered*: Enforcing `NOT NULL` with defaults (e.g. `0.0` or `-1`). Rejected because these could feed into analytics or AI pipelines as genuine real-world readings. `NULL` accurately denotes dropped signals.

## Risks / Trade-offs

- **[Risk] Null Handling in Analytic Queries** → *Mitigation:* Ensure the Analytic Service (Go API) query layer and Intelligent Service appropriately filter or aggregate around `NULL` points so visualizations and logic evaluations do not crash on missing streams.
- **[Risk] Write Contention During Migration** → *Mitigation:* Because we rely on batch inserts (every 5 mins on Ingestion), the SQL upgrade/creation for `telemetry` must be applied cleanly when batch execution is paused or via robust initialization prior to service startup.
