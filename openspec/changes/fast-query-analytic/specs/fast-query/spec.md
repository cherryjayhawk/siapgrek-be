## ADDED Requirements

### Requirement: Expose Latest Telemetry Query Endpoint
The system MUST provide a high-performance HTTP GET endpoint to retrieve the most recent sensor telemetry data for a specific device without triggering complex aggregations.

#### Scenario: Successfully query latest telemetry
- **WHEN** a client performs a GET request to `/api/v1/telemetry/latest?device_id=node1`
- **THEN** the system returns a 200 HTTP status code with the most recent telemetry JSON payload for `node1`.

#### Scenario: Query latest telemetry for missing device
- **WHEN** a client performs a GET request to `/api/v1/telemetry/latest?device_id=unknown_node`
- **THEN** the system returns a 404 HTTP status code or an empty response array without dropping database connections.

### Requirement: Expose Time-bucketed Historical Telemetry Endpoint
The system MUST provide an HTTP GET endpoint to query historical telemetry data aggregated into relevant time buckets based on predefined time range presets.

#### Scenario: Query by predefined time ranges
- **WHEN** a client performs a GET request to `/api/v1/telemetry/history?device_id=node1&range={preset}` where `{preset}` is one of:
  - `last_5m` (5 minutes, bucket: raw or 10s)
  - `last_15m` (15 minutes, bucket: raw or 10s)
  - `last_1h` (1 hour, bucket: 1m)
  - `last_6h` (6 hours, bucket: 5m)
  - `last_24h` (24 hours, bucket: 15m)
  - `last_7d` (7 days, bucket: 1h)
  - `last_30d` (30 days, bucket: 6h)
  - `today` (Since start of current day, bucket: 1h)
  - `yesterday` (Previous day solely, bucket: 1h)
  - `this_week` (Since start of current week, bucket: 1d)
  - `this_month` (Since start of current month, bucket: 1d)
  - `this_quarter` (Since start of current quarter, bucket: 1w)
  - `this_half` (Since start of current half-year, bucket: 1w)
  - `this_year` (Since start of current year, bucket: 1w or 1mo)
- **THEN** the system determines the correct start time, end time, and appropriate `time_bucket` interval, executing the query and returning the aggregated data.

#### Scenario: Reject unknown time ranges
- **WHEN** a client performs a GET request to `/api/v1/telemetry/history?device_id=node1&range=unknown_range`
- **THEN** the system MUST return a 400 HTTP status code indicating the range parameter is invalid, enforcing the allowed preset catalog.

### Requirement: Database Connection Pooling
The system MUST isolate its database connections using a dedicated read-only connection pool with enforced connection limits (e.g., `MaxConns`) to prevent exhaustion of TimescaleDB sockets needed by critical ingestion workers.

#### Scenario: Analytic service boots up
- **WHEN** the `analytic-service` container starts
- **THEN** it successfully connects to TimescaleDB, enforces a strict `pgxpool` configuration, and becomes ready to accept incoming GET requests.

#### Scenario: Under severe read load
- **WHEN** the service receives a sudden burst of 1000 concurrent historical query requests
- **THEN** the API restricts database transactions to the defined pool limit, queueing or timing out excess requests gracefully with a 503 instead of crashing the database.
