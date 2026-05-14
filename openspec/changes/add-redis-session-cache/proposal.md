## Why

Currently, Better Auth stateful JWT validation requires querying the database on every protected request to validate the session. This introduces unnecessary per-request database lookups and latency. By adding a Redis-based caching layer for session validation results (mapping tokens to userId and expiresAt), we can drastically reduce database load and improve response times for all authenticated services.

## What Changes

- **Add session caching middleware:** Services consuming Better Auth will check Redis for session validity before falling back to the PostgreSQL database.
- **Cache populating:** On a successful database fallback lookup, the session data will be cached in Redis with a TTL matching the session's expiration time.
- **Cache invalidation:** Ensure the cache entry is explicitly deleted from Redis upon user logout or any session revocation events.
- **BREAKING:** The authentication middleware/service logic will now strictly depend on the Redis connection to function optimally, though it should handle Redis unreachability gracefully if possible.

## Capabilities

### New Capabilities
- `session-caching`: Establish Redis caching layer for stateful Better Auth JWT session validation.

### Modified Capabilities

## Impact

- **Affected Services:** `auth-service` and any application services validating tokens (e.g., `intelligent-service`, `analytic-service`, `knowledge-service`).
- **Dependencies:** The applications validating auth now require interaction with `redis` cache or the auth service depending on how validation is centralized.
- **Performance:** Reduced database I/O for `session` queries and decreased latency for protected API routes.
