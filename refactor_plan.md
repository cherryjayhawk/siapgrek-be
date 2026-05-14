# System Refactoring Plan

After a thorough analysis of the codebase, several key areas require immediate attention to clean up the current implementation, improve security, and standardize the architecture across the microservices.

## 1. Infrastructure & Security Configuration
The current `docker-compose.yml` and service configurations have critical security and consistency issues.

* **Hardcoded Credentials:** The `knowledge-service` in `docker-compose.yml` has a hardcoded NeonDB connection string containing a plain-text password. 
  * *Action:* Replace this with a reference to the local TimescaleDB instance using variables (e.g., `DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@timescaledb:5432/${POSTGRES_DB}?schema=public`), matching `auth-service`. If NeonDB is required for production, use a `.env` file instead.
* **Credential Leaks in Code:** `analytic-service/internal/database/db.go` logs the `DATABASE_URL` upon connection (`log.Println("DATABASE_URL:", dsn)`).
  * *Action:* Remove this log statement immediately to prevent exposing database passwords in the service logs.
* **Hardcoded Defaults:** `db.go` in `analytic-service` also hardcodes fallback credentials (`orchid_admin`, `Orchid2026`) and internal hostnames.
  * *Action:* Remove hardcoded credentials. Rely entirely on environment variables, failing fast if they are missing.
* **Environment Variable Inconsistency:** Some services (`intelligent-service`, `ingestion-service`) use `env_file`, while others use `environment` blocks in `docker-compose.yml`.
  * *Action:* Standardize environment variable injection. Prefer `env_file` for local development secrets and `environment` overrides for Docker-specific routing (like internal hostnames).

## 2. Incomplete Services & Mocked Integrations
* **Stubbed `intelligent-service`:** The `intelligent-service` is defined as a Python FastAPI + AI/ML service in `docker-compose.yml`, but its `main.py` only contains a `print("Hello from intelligent-service!")` statement.
  * *Action:* Implement the actual FastAPI application, connect it to MQTT (`mosquitto`), and Redis as specified in the compose file, or remove it temporarily if it's not ready.
* **Mocked Frontend APIs:** The `frontend` application is currently disconnected from the backend microservices. Data fetching (e.g., `/api/sensor`, `/api/anomaly`) hits local Next.js route handlers that return hardcoded mock JSON data rather than calling `analytic-service` or `intelligent-service`.
  * *Action:* Replace mocked Next.js API routes with actual HTTP calls to the respective backend services. Configure CORS or use Next.js rewrites in `next.config.ts` to proxy requests cleanly.

## 3. Node/Bun Ecosystem Standardization
* **Mixed Package Managers:** The `frontend` application uses `npm` (`package-lock.json`), while the backend Node/TS services (`auth-service`, `knowledge-service`, `ingestion-service`) use `Bun` (`bun.lock`). Furthermore, `frontend` has its own `.git` directory.
  * *Action:* Decide on a single JS/TS package manager (preferably Bun or NPM workspaces) to handle the monorepo structure. Remove nested `.git` folders if this is intended to be a single monorepo.
* **Database Drivers:** Within the TypeScript services, `auth-service` uses the `pg` package (`new Pool()`), while `ingestion-service` uses `postgres.js` (`postgres()`).
  * *Action:* Standardize on a single PostgreSQL client across all TypeScript microservices to reduce mental overhead and potential driver-specific quirks.

## 4. Code Quality and Runtime Bugs
* **Unreachable Code:** In `auth-service/src/index.ts`, `console.log` is placed *after* the `export default` block. Since Bun serves the app by reading the default export, this log will never run.
  * *Action:* Move startup logs into an initialization function or before the export.
* **CORS Inconsistencies:** `auth-service` dynamically configures CORS based on `TRUSTED_ORIGINS`, while `knowledge-service` allows `origin: "*"` globally.
  * *Action:* Implement a shared, secure CORS strategy across all web-facing services.
* **Startup Health Checks:** `ingestion-service` checks DB connectivity before starting MQTT but silently fails if the DB is down. `analytic-service` does a proper ping but other services don't verify dependencies at startup.
  * *Action:* Implement a uniform startup sequence for all services: verify DB/Redis/MQTT connections -> Start HTTP/Worker -> Log readiness.

## Proposed Execution Phases

### Phase 1: Security & Secrets (Immediate)
1. Strip all hardcoded database URIs from `docker-compose.yml`.
2. Remove credential logging in Go (`db.go`).
3. Ensure `.env.example` templates exist for all services without containing real secrets.

### Phase 2: Monorepo & Tooling Standardization
1. Unify package managers (migrate `frontend` to Bun or use a unified workspace).
2. Clean up nested `.git` directories if this is a monorepo.
3. Standardize database drivers in Node/Bun services.

### Phase 3: Service Implementations & Bug Fixes
1. Scaffold the actual FastAPI server for `intelligent-service`.
2. Wire `frontend` to real backend services, replacing mocked Next.js API routes.
3. Fix unreachable code in Bun entry points.
4. Standardize CORS and health check endpoints across Fiber, Hono, and FastAPI.
