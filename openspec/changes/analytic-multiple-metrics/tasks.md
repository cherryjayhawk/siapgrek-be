## 1. Database Layer Modifications (`internal/database/db.go` or data models repo logic)

- [x] 1.1 Add a hardcoded whitelist array or map of allowed metric columns (e.g., `"soil_temperature"`, `"soil_humidity"`, `"env_temperature"`, `"env_humidity"`, `"lux"`).
- [x] 1.2 Modify the database telemetry model structs (if needed) with `omitempty` JSON tags to ensure unrequested columns (which will be `nil` or un-scanned) do not appear in the final JSON response.
- [x] 1.3 Update the database querying functions (e.g., `GetTelemetry` or similar) to accept an array of requested `metrics []string`.
- [x] 1.4 Refactor the SQL query builder inside the database fetching function to dynamically build the `SELECT` clause using `strings.Builder`. If `metrics []string` is empty, it MUST fall back to selecting all telemetry columns.

## 2. API Routing & Handlers (`internal/handlers/telemetry.go`)

- [x] 2.1 Update the Fiber telemetry retrieval handler to parse multiple `metric` query parameters from the HTTP request.
- [x] 2.2 Implement validation logic within the handler to iterate through the parsed metrics and verify they exist against the whitelist. If any metric is invalid, return an `HTTP 400 Bad Request` immediately.
- [x] 2.3 Pass the validated `metrics` string slice to the database fetching function.

## 3. Testing & Verification

- [x] 3.1 Send a test `GET` request with no parameters to ensure backward compatibility and verify all data points are returned.
- [x] 3.2 Send a test request with a valid subset (e.g., `?metric=soil_temperature&metric=lux`) and assert the JSON response is sparse and only includes the requested fields.
- [x] 3.3 Send a request with an invalid metric query parameter and assert an HTTP 400 error is returned.
