## Why
The central identity and access management system needs to be established for the Greenhouse Orchid IoT System. Providing a centralized service that handles JWT issuance, validation, and session tracking is necessary to secure API endpoints and manage user access effectively across the system's microservices and dashboard.

## What Changes
*   Create a new `auth-service` using Bun and TypeScript.
*   Implement user authentication using Better Auth (email/password).
*   Add JWT (access + refresh token) issuance and validation logic for secure, stateless access.
*   Implement secure, database-backed session management enabling session revocation, tracking, and auditability.
*   Configure Docker setup (`Dockerfile`) for the `auth-service`.

## Capabilities

### New Capabilities
- `user-auth`: Managing user identity, registration, and login functionality using Better Auth and JWTs.
- `session-management`: Handling database-backed secure sessions, token refreshes, and session revocation logic.

### Modified Capabilities

## Impact
*   **Infrastructure:** The `auth-service` module will be implemented under `services/auth-service/`.
*   **Database:** Modifies the PostgreSQL database schema to include `user` and `session` tables as automatically managed by Better Auth.
*   **Security:** Establishes the core identity token mechanism that will be utilized by other services to authorize user requests.

## Non-goals
*   Implementing third-party OAuth providers (Google, GitHub, etc.) at this stage.
*   Complex Role-Based Access Control (RBAC); initial focus is strictly on authentication (verifying identity) rather than deep authorization rules.
*   Integrating the authentication verification into all other services in this specific change; the focus here is strictly on *building* the auth service itself.
