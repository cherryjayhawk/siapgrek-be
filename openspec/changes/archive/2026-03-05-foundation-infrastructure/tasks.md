## 1. Monorepo Setup & Configuration

- [x] 1.1 Create the global directory structure. Target folders: `edge/src`, `services/`, `database/`, and a `mosquitto/` folder.
- [x] 1.2 Create a global `.env` file at the root. It must contain the environment variables for infrastructure passwords (e.g., `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB`, `MOSQUITTO_USERNAME`, `MOSQUITTO_PASSWORD`, `DATABASE_URL`).
- [x] 1.3 Create Mosquitto configuration files at `mosquitto/config/mosquitto.conf`. The config must set `allow_anonymous false`, specify `password_file /mosquitto/config/pwfile`, and define a default listener on port 1883.
- [x] 1.4 Create a dummy `mosquitto/config/pwfile` or a script to generate one using the `.env` credentials so the broker does not crash on startup.

## 2. Docker Compose Infrastructure

- [x] 2.1 Create the root `docker-compose.yml`. Define a custom bridge network named `orchid-net`. Define named volumes: `mosquitto-data`, `mosquitto-config`, `timescaledb-data`, and `redis-data`.
- [x] 2.2 Add the `mosquitto` service using the `eclipse-mosquitto:latest` Alpine image. Expose port `1883`. Mount the local `mosquitto/config` directory and the `mosquitto-data` named volume. Attach to `orchid-net`.
- [x] 2.3 Add the `timescaledb` service using the `timescale/timescaledb:latest-pg17` image. Expose port `5432`. Inject POSTGRES credentials from the `.env`. Mount the `timescaledb-data` volume. Attach to `orchid-net`.
- [x] 2.4 Add the `redis` service using the `redis:alpine` image. Expose port `6379`. Mount the `redis-data` named volume. Attach to `orchid-net`. Provide test criteria: run `docker-compose up -d` and verify all 3 containers are healthy.

## 3. Database Schema (Prisma)

- [x] 3.1 Initialize a new Node project within the `database/` directory and install `prisma` as a dev dependency (`pnpm init` and `pnpm install -D prisma`). Run `npx prisma init` inside that folder. Connect it to the TimescaleDB using the `DATABASE_URL` from the `.env`.
- [x] 3.2 Define the `user` and `session` tables in `database/prisma/schema.prisma` mapping to the Better Auth core session specification (id, email, password, etc., for user; id, token, userId, expiresAt for session).
- [x] 3.3 Define the `disease_log` table in `schema.prisma`. It must contain `id` (String/UUID), `timestamp` (DateTime), `device_id` (String), `disease_name` (String), `confidence_score` (Float), and `image_reference` (String/Nullable).
- [x] 3.4 Define the `anomaly_record` table in `schema.prisma`. It must contain `id` (String/UUID), `timestamp` (DateTime), `device_id` (String), `sensor` (String), `recorded_value` (Float), `threshold_value` (Float), and `resolved` (Boolean default false).
- [x] 3.5 Ensure the TimescaleDB container is running, then execute `npx prisma migrate dev --name init_core_schema` from the `database/` folder to apply the schema. Verify that the tables are created natively in TimescaleDB.
