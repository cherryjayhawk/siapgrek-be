## Context

The Greenhouse Orchid IoT System relies on multiple independent microservices interacting with a central database and message broker. To ensure system security and track user activities (like manual interventions overriding edge logic), we require a centralized Identity and Access Management (IAM) provider. By building an `auth-service` as defined in the Phase 4 monorepo schema, we provide the foundational component that manages secure authentication via email/password, issues JWT tokens, and manages database-backed sessions using Better Auth.

## Goals / Non-Goals

**Goals:**
*   Implement a stateless-first token architecture using JWT (Access / Refresh tokens) to minimize latency for high-frequency dashboard requests.
*   Establish database-backed session state with PostgreSQL + Better Auth to enable session revocation and audit logging.
*   Deploy as an isolated, containerized microservice running on Bun and TypeScript.
*   Provide clear endpoints for registering, logging in, and logging out users.

**Non-Goals:**
*   Implementation of complex Role-Based Access Control (RBAC) layers beyond basic user authentication.
*   Modification of other existing codebases (like the edge layer or anomaly worker) to enforce these tokens in this specific change.
*   OAuth third-party integrators (Google, Microsoft) are deferred to later iterations.

## Decisions

**1. Better Auth on Bun**
*   **Rationale:** Better Auth provides out-of-the-box PostgreSQL integration and manages JWT issuance and secure cookie handling effectively. Bun offers significant performance improvements and minimal memory overhead compared to Node.js, aligning with the project's strategy for lightweight containers on VPS deployments.
*   **Alternatives Considered:** NextAuth (tied specifically to Next.js; incompatible with purely headless backend service architecture). Supabase Auth (introduces heavy external dependencies rather than keeping the stack localized in our PostgreSQL instance).

**2. Asymmetric Stateless JWTs with DB-Backed Sessions**
*   **Rationale:** System services (e.g., `analytic-service`, `intelligent-service`) can verify user scopes via JWTs without pinging the DB every time. The tokens establish identity, mapped to a DB session. When critical actions happen, checking the DB session provides an immediate ability to revoke access if compromised.
*   **Alternatives Considered:** Purely stateless JWTs (risky, no way to forcibly end user sessions without token blacklisting overhead). Purely stateful sessions via Redis (adds latency overhead for normal dashboard polling reads).

**3. Password/Email Strategy**
*   **Rationale:** Simple, robust, standard strategy appropriate for closed ecosystem usage by greenhouse administrators.

## Risks / Trade-offs

**[Risk] Token Validation Overhead (Latency Shift)**
*   **Rationale:** Even with stateless JWTs, Better Auth introduces some parsing overhead. If every telemetry polling request checks authentication, it could lightly impact dashboard rendering performance.
*   **Mitigation:** The `auth-service` manages token creation, but services like `analytic-service` should validate tokens statelessly using public keys/signatures to preserve raw read speeds. Latency for login/refresh bounds out at ~50-80ms max, which is acceptable since it occurs minimally compared to continuous telemetry ingestion.

**[Risk] Service Failure Isolation**
*   **Rationale:** If `auth-service` goes offline, users cannot log in or refresh tokens. 
*   **Mitigation:** System telemetry ingestion and ESP32 edge actuation operate independently of user dashboards. Edge operations continue via the decoupled backend, fully separating operational autonomy from user presence. Auth service will gracefully rely on Docker restart policies.
