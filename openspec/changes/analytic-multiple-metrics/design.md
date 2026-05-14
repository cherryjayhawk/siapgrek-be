## Context

The `analytic-service` (Go + Fiber) acts as a high-performance query engine for TimescaleDB, serving telemetry data to the frontend and other consumers. Currently, queries to the endpoint fetch all columns from the `telemetry` table. When users load specific line charts (e.g., just `lux` or `soil_temperature`), the database and the network payload still process all telemetry columns. 

As the amount of logged telemetry grows, minimizing TimescaleDB scan sizes and reducing JSON payload sizes over the network are vital for maintaining low latency. We need an API enhancement to allow clients to request exactly the parameters they need via multiple `metric` query queries gracefully, with appropriate fallback behavior.

## Goals / Non-Goals

**Goals:**
*   Enable the telemetry retrieval endpoint in `analytic-service` to accept multiple query parameters: e.g., `?metric=soil_temperature&metric=env_humidity`.
*   Validate the requested metrics against a strict whitelist of known telemetry columns to prevent SQL injection or bad requests.
*   Dynamically construct the `SELECT` clause in the Go SQL layer so only requested columns are grabbed and aggregated from TimescaleDB.
*   Return a sparse JSON structure that omits non-requested fields.
*   Maintain backwards compatibility: if no `metric` parameters are passed, select and return all available telemetry columns.

**Non-Goals:**
*   Adding new aggregation types (e.g., min, max) – we stick to the existing behavior (like time-bucketed averages).
*   Modifying the schema structure or the underlying data ingestion flow.

## Decisions

**1. Query Parameter Format (Multiple `metric` keys):**
*   **Decision:** Use repetitive query params: `?metric=soil_temperature&metric=lux`.
*   **Rationale:** Supported natively by standard HTTP URL parsing and Fiber. Easier to type safely in frontend clients than comma-separated lists `?metric=soil_temperature,lux`.
*   **Alternatives:** Comma-separated strings. Rejected because it requires extra string-splitting overhead in Go.

**2. Strict SQL Whitelisting:**
*   **Decision:** Maintain a hardcoded whitelist array map or a `switch` statement in Go mapping requested metric strings directly to their known, safe SQL column names (`soil_temperature`, `soil_humidity`, `env_temperature`, `env_humidity`, `lux`). 
*   **Rationale:** Protects against SQL injection when dynamically building the `SELECT` statement. If an invalid metric is requested, the API should return a `400 Bad Request`.

**3. Fallback to All Metrics:**
*   **Decision:** If the `metric` parameter array is empty, default the `SELECT` query builder to use the exhaustive list of all known columns. 
*   **Rationale:** Preserves backwards compatibility for older clients that haven't been updated to request specific metrics.

**4. Performance/Latency Considerations:**
*   **Decision:** The dynamic string builder for the SQL query will use pre-allocated buffers or `strings.Builder` in Go to minimize memory allocations.
*   **Rationale:** Building SQL dynamically per request normally increases GC pressure; using `strings.Builder` keeps performance high even under concurrent loads. Dynamically reducing the returned columns heavily shrinks the JSON marshal payload naturally, yielding an immediate latency and I/O improvement.

## Risks / Trade-offs

*   **Risk:** Invalid metrics requested by client.
    *   **Mitigation:** The Go backend MUST reject or dynamically sanitize unmapped column requests via a strict whitelist and return a `400 Bad Request`.
*   **Risk:** Increased complexity in the data repository query builder.
    *   **Mitigation:** Encapsulate the dynamic SQL building logic into a specific function, isolating it from the main HTTP handler logic.
