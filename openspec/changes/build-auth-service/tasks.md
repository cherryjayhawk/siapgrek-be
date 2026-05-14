## 1. Project Initialization & Environment Setup

- [x] 1.1 Initialize Bun project in `auth-service`
  - **Description**: Set up the foundational `package.json` and TypeScript configuration inside the `services/auth-service` directory. Install necessary dependencies including `hono`, `better-auth`, and the PostgreSQL driver.
  - **Target Files**: `services/auth-service/package.json`, `services/auth-service/tsconfig.json`
  - **Acceptance Criteria**: Running `bun install` inside the folder succeeds and produces a valid Bun lockfile without errors. TypeScript is configured for strict mode.

- [x] 1.2 Create `auth-service` Dockerfile and compose integration
  - **Description**: Write a `Dockerfile` for the `auth-service` using the Bun alpine image. Ensure it connects to the system's `postgres` via `docker-compose.yml`.
  - **Target Files**: `services/auth-service/Dockerfile`, `docker-compose.yml`
  - **Acceptance Criteria**: Running `docker compose build auth-service` builds successfully. The service starts on the specified mapped port.

## 2. Database & Core Auth Configuration

- [x] 2.1 Set up database connection and Better Auth configuration
  - **Description**: Implement `src/db.ts` to connect to the PostgreSQL database using environment variables. Implement `src/auth.ts` utilizing `better-auth` initialized with the email/password provider, JWT capability, and session management linked to the database adapter.
  - **Target Files**: `services/auth-service/src/db.ts`, `services/auth-service/src/auth.ts`
  - **Acceptance Criteria**: The project compiles successfully. Database client correctly initializes using standard `DATABASE_URL` injections.

- [x] 2.2 Generate and apply Better Auth SQL migrations
  - **Description**: Use Better Auth CLI to generate the schema required for the `user` and `session` tables. Apply these migrations to the global PostgreSQL container schema.
  - **Target Files**: Database schema/migration SQL scripts (e.g., `services/auth-service/schema.sql` or similar).
  - **Acceptance Criteria**: The `user` and `session` tables exist in the database with appropriate column types defined by Better Auth.

## 3. Server Integration & Route Handling

- [x] 3.1 Mount Better Auth handlers in Hono server
  - **Description**: Create the main entry point `src/index.ts` utilizing Hono. Mount the Better Auth API handlers onto a standard route (e.g., `/api/auth/*`) to expose the authentication capabilities to external services.
  - **Target Files**: `services/auth-service/src/index.ts`
  - **Acceptance Criteria**: The Hono server starts successfully with a generic `/health` check returning 200 OK. Hitting `/api/auth/error` or similar default path responds correctly from the Better Auth handler.

## 4. Verification & Testing

- [x] 4.1 Validate Registration, Login, and Revocation flows
  - **Description**: Write a small Bun integration test or structured CURL scripts that verify the complete lifecycle: signing up a user, logging in to receive cookies/JWT tokens, verifying DB session creation, and signing out to demonstrate session invalidation.
  - **Target Files**: `services/auth-service/tests/auth.test.ts`
  - **Acceptance Criteria**: The test successfully passes the automated flow: signing up -> returning an account record; logging in -> dropping valid JWT session cookies; logging out -> effectively breaking the session token reuse.
