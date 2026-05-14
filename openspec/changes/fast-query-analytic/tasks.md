## 1. Project Initialization & DB Setup

- [x] 1.1 Initialize Go project and Fiber framework
  - Target Path: `services/analytic-service/go.mod`, `services/analytic-service/main.go`
  - Acceptance Criteria: `go mod init` is executed. A basic Fiber server instance compiles and returns a 200 OK on a `/health` endpoint.
- [x] 1.2 Implement Database Connection Pooling (`pgxpool`)
  - Target Path: `services/analytic-service/internal/database/db.go`
  - Acceptance Criteria: Implement a `pgxpool` connection to TimescaleDB utilizing env vars. Add a `MaxConns` configuration for bounded read-only query limiting. Verify successful connection on startup.

## 2. API Endpoints Implementation

- [x] 2.1 Implement `/api/v1/telemetry/latest` Endpoint
  - Target Path: `services/analytic-service/internal/handlers/telemetry.go`, `services/analytic-service/main.go`
  - Acceptance Criteria: Fiber route is created. It expects a `device_id` query parameter. It executes a `SELECT` query against the `telemetry` hypertable sorted by `timestamp DESC LIMIT 1`. Returns JSON payload or empty array.
- [x] 2.2 Implement `/api/v1/telemetry/history` Endpoint (Predefined Time-Ranges)
  - Target Path: `services/analytic-service/internal/handlers/telemetry.go`
  - Acceptance Criteria: Fiber route is created. Expects `device_id` and `range` (e.g., `last_7d`, `today`, `this_month`) query parameters. Translates the given `range` preset into a proper start/end timeframe and specific TimescaleDB `time_bucket` interval, returning the correctly aggregated JSON array.
- [x] 2.3 Add Parameter Validation and Safety Limits
  - Target Path: `services/analytic-service/internal/handlers/telemetry.go`
  - Acceptance Criteria: Reject `/history` requests where the `range` parameter is missing or does not strictly match the predefined list of allowed presets. Returns a 400 Bad Request to protect the TimescaleDB.

## 3. Dockerization and Integration

- [x] 3.1 Create Optimized Alpine Dockerfile
  - Target Path: `services/analytic-service/Dockerfile`
  - Acceptance Criteria: Multi-stage Docker build resulting in a compiled Alpine binary. Must expose the Fiber port (e.g., 3000). Image size should be minimal.
- [x] 3.2 Add Service to System `docker-compose.yml`
  - Target Path: `docker-compose.yml`
  - Acceptance Criteria: Add `analytic-service` to the core compose file. Link DB environment variables correctly. Ensure it depends on `timescaledb`. Ensure the service boots successfully within the compose network.
