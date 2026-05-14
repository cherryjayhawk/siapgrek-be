## 1. Environment & Infrastructure Setup

- [x] 1.1 Verify Redis Connection Variables
  - **Path**: `services/auth-service/.env`, `services/analytic-service/.env.example`
  - **Acceptance Criteria**: Ensure that the `REDIS_URL` or equivalent environment variables are defined and mapped correctly to the Dockerized Redis container for any service needing caching access.
- [x] 1.2 Install Redis Client libraries
  - **Path**: `services/auth-service/package.json`
  - **Acceptance Criteria**: Install `ioredis` (or the preferred Redis client for Bun/TS) in the `auth-service` package.

## 2. Caching Implementation (Auth Service)

- [x] 2.1 Implement Redis Cache Utilities
  - **Path**: `services/auth-service/src/lib/redis.ts`
  - **Acceptance Criteria**: Create and export utility functions: `getCachedSession(token)`, `setCachedSession(token, sessionData, ttlSeconds)`, and `invalidateCachedSession(token)`. Includes basic try/catch error handling around Redis calls to allow silent fallbacks if Redis fails.
- [x] 2.2 Re-wire Session Validation Middleware
  - **Path**: `services/auth-service/src/middleware/auth.ts` (or equivalent API endpoint validating sessions)
  - **Acceptance Criteria**: Update the session verification logic. First, check Redis. If found, return cached session immediately. If cache miss, fallback to PostgreSQL/BetterAuth core. If the DB returns a valid session, explicitly cache it using `setCachedSession` with a TTL mapped to its remaining valid life.

## 3. Cache Invalidation & Consistency

- [x] 3.1 Implement Logout Cache Invalidation
  - **Path**: `services/auth-service/src/auth.ts` (Better Auth configuration)
  - **Acceptance Criteria**: Add a hook/callback or override the logout endpoint so that whenever a user logs out (or their session is otherwise explicitly revoked), `invalidateCachedSession(token)` is triggered immediately deleting the Redis key `session:{token}`.

## 4. Test & Integration

- [x] 4.1 Provide Integration Tests for Cache Path
  - **Path**: `services/auth-service/test/auth.test.ts` (or similar test suite)
  - **Acceptance Criteria**: Write a test verifying that subsequent protected route requests accurately increment the cache-hit metric and avoid a DB lookup. Verify that after logging out, the cache is explicitly empty.

