## ADDED Requirements

### Requirement: Centralized cache layer for session validation
The system MUST provide a Redis-based caching layer that sits in front of the PostgreSQL database to validate Better Auth stateful JWT sessions.

#### Scenario: Validating an existing cached session
- **WHEN** a protected service requests validation for an active token that has been previously cached
- **THEN** the auth middleware successfully reads and returns the session object directly from Redis without querying PostgreSQL.

#### Scenario: Fallback on cache miss
- **WHEN** the session does not exist in Redis but is unexpired and valid in PostgreSQL
- **THEN** the system queries PostgreSQL, validates the session, and seamlessly caches the session in Redis with the appropriate TTL before returning.

### Requirement: Cache Lifecycle and Garbage Collection
The system MUST assign a Time-To-Live (TTL) on the cached session key in Redis, mapped precisely to the underlying session's defined expiration timestamp.

#### Scenario: Session natively expires
- **WHEN** a cached session reaches its TTL expiration
- **THEN** Redis automatically evicts the target token key from memory, requiring any subsequent lookups to naturally fail or fallback to database lookup.

### Requirement: Explicit Cache Invalidation
The auth service MUST proactively invalidate the specific cached session from Redis upon explicit user logout or token revocation events.

#### Scenario: User logs out
- **WHEN** the user triggers the logout endpoint or their session is explicitly revoked by the system
- **THEN** the system issues a deletion command to Redis, immediately removing the cached entry to ensure cache-database consistency.
