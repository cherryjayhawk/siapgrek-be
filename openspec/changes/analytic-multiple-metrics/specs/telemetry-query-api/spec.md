## ADDED Requirements

### Requirement: Dynamic Metric Selection
The `analytic-service` SHALL parse multiple `metric` query parameters from the `GET /api/telemetry` request and return a JSON payload containing only those specific aggregated metrics alongside the default fields (like `timestamp` and `device_id`).

#### Scenario: Client requests specific valid metrics
- **WHEN** a client performs a `GET` request with `?metric=soil_temperature&metric=lux`
- **THEN** the API returns a JSON response containing only the `timestamp`, `device_id`, `soil_temperature`, and `lux` fields.

### Requirement: Default Wildcard Fallback
The `analytic-service` SHALL return all available telemetry columns if the request does not contain any `metric` query parameters.

#### Scenario: Client requests data without metric filters
- **WHEN** a client performs a `GET` request without providing any `metric` query parameters
- **THEN** the API returns a JSON response containing all available metric fields (`soil_temperature`, `soil_humidity`, `env_temperature`, `env_humidity`, `lux`) along with the required indexing fields (`timestamp`, `device_id`).

### Requirement: Strict Metric Whitelisting
The `analytic-service` SHALL validate all requested metrics against a strict, predefined whitelist of acceptable database columns. If any requested metric is invalid or unrecognized, the entire request SHALL be rejected.

#### Scenario: Client requests an invalid metric
- **WHEN** a client performs a `GET` request with `?metric=invalid_column&metric=lux`
- **THEN** the API responds with an HTTP 400 Bad Request status code and a descriptive error message indicating that the requested metric is invalid.
