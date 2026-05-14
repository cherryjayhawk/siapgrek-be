## Why

Clients currently retrieve all telemetry metrics when querying the Analytic Service, which wastes bandwidth and processing power when they only need specific data points (e.g., only `soil_temperature` and `lux`). By enabling multiple `metric` query parameters, the API can dynamically select and aggregate only the requested metrics, significantly improving query performance and reducing payload size for the clients.

## What Changes

*   Add support for accepting multiple `metric` query parameters in the Analytic Service telemetry retrieval API (e.g., `?metric=env_temperature&metric=env_humidity`).
*   Dynamically validate the requested metrics against a predefined whitelist.
*   Update the database query generation to only select and aggregate the specifically requested metrics.
*   Modify the API response payload to omit unrequested metrics.
*   Maintain backwards compatibility or default behavior to return all metrics if no specific `metric` parameters are provided.

## Capabilities

### New Capabilities
- `telemetry-query-api`: Defines how clients can securely query historical telemetry data with specific metric filtering.

### Modified Capabilities

## Impact

*   **Analytic Service (`services/analytic-service`)**: The API routing, handlers, and TimescaleDB repository functions will need to be updated to parse query parameters, validate whitelists, and dynamically construct SQL queries.
*   **Clients/Frontend**: Will benefit from optimized payload sizes and faster load times.

## Non-Goals

*   This change does not modify the telemetry data schema or how data is ingested and stored in TimescaleDB.
*   This change does not introduce complex querying operators (like `>` or `<`) or custom aggregation functions, only column-level selection.
