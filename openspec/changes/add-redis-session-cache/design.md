## Context

Currently, the `auth-service` and other application services validating requests via Better Auth must perform a PostgreSQL database lookup to verify the stateful JWT session on every protected request. In a distributed IoT microservice architecture with high-frequency analytical queries, this introduces latency and unnecessary I/O bottleneck on the database. Redis is already part of the infrastructure for BullMQ, which makes it available to be leveraged as a fast key-value cache layer.

## Goals / Non-Goals

**Goals:**
- Eliminate per-request PostgreSQL queries for valid session lookups.
- Centralize session validation via a fast Redis cache.
- Ensure the cache remains consistent with the database by invalidating entries on logout.

**Non-Goals:**
- Replacing the PostgreSQL database as the primary source of truth for session persistence.
- Modifying Better Auth core libraries (we will implement this at the middleware/service layer).
- Extending the cache to cover non-session data (e.g. telemetry caching).

## Decisions

**1. Cache Key Strategy**
- **Decision:** Use a structured prefix `session:{token}` as the Redis key.
- **Rationale:** Prevents collisions with BullMQ keys. The token is the unique identifier naturally provided by incoming requests.
- **Alternatives Considered:** Using `user:{userId}:session` - rejected because validation happens by token, making lookups by token O(1).

**2. State Storage & TTL**
- **Decision:** Cache the minimal required data `(userId, expiresAt, ...etc)` as a JSON string with a Redis TTL mapped exactly to the session's JWT `expiresAt` property.
- **Rationale:** Setting a TTL natively on Redis ensures old sessions are automatically garbage collected without manual background jobs. It prevents memory leaks.

**3. Invalidation Strategy**
- **Decision:** The logout endpoint and any session revocation flows will explicitly run a `DEL session:{token}` command in Redis.
- **Rationale:** Ensures immediate invalidation, protecting against hijacked but technically unexpired sessions. Ensures consistency between DB and cache.

**4. Fallback Handling**
- **Decision:** Cache misses will fall back to querying the Better Auth session via the database. If valid, the result is immediately populated back into Redis.
- **Rationale:** Prevents failure if Redis goes down or if the session was simply evicted, maintaining system resilience. 

## Risks / Trade-offs

- **[Risk] Redis Connection Failure** → Mitigation: Implement graceful error handling when interacting with Redis during session validation. Fallback silently to PostgreSQL read on cache failure to maintain uptime.
- **[Risk] Stale Session Cache Update** → Mitigation: If a session is explicitly mutated or extended during refresh flows, make sure the update logic overwrites the existing Redis key with the new data and TTL. 
