## ADDED Requirements

### Requirement: Session State Persistence
The system SHALL persist robust user sessions centrally in the PostgreSQL database using Better Auth logic.

#### Scenario: Persistent Session Creation
- **WHEN** a user securely logs in via registered credentials
- **THEN** a persistent session recording device/browser context is inserted into the session table

### Requirement: Stateless Access Control Tokens
The system SHALL issue JSON Web Tokens (JWT) mapped to session integrity to enable sub-millisecond validation checks across decoupled microservices.

#### Scenario: Valid JWT Verification
- **WHEN** an edge/analytic/insight service intercepts a request bearing a JWT Authorization header
- **THEN** the service verifies the token using the system's public signing keys without necessarily requiring a database lookup

### Requirement: Secure Authorization Refresh
The system SHALL grant renewed, short-lived JWTs to active client sessions equipped with unexpired valid refresh tokens.

#### Scenario: Refresh Sequence
- **WHEN** the frontend submits a valid refresh cookie pointing to an open session entry
- **THEN** the server signs and returns a new active access token, maintaining user flow without re-authentication

### Requirement: Granular Session Revocation
The system SHALL allow session invalidation, neutralizing related refresh tokens against subsequent authorization refresh attempts.

#### Scenario: Active Logout Event
- **WHEN** an authenticated application signals a `/sign-out` request
- **THEN** the corresponding session is deleted from the PostgreSQL backing store, completely halting token renewal abilities
