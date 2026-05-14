## Context

The Greenhouse Orchid IoT System relies on a distributed microservice architecture to decouple hardware ingestion from complex AI insights and background data processing. To support these services, we need a robust underlying infrastructure. Before any code for the worker services (Ingestion, Intelligence, Analytic, Auth, Knowledge) or the edge ESP32 logic can be developed, the foundation must be established. 

This foundation includes establishing the monorepo directory structure, setting up the global Docker Compose network with our core dependencies (MQTT broker, Time-series Database, and Pub/Sub queue), creating global environment variable templates, and defining the relational database tables that will store domain context for our intelligent system.

## Goals / Non-Goals

**Goals:**
- Provide a unified, reproducible local deployment environment for all developers using Docker Compose.
- Deploy Eclipse Mosquitto for MQTT message routing.
- Deploy TimescaleDB (PostgreSQL) for relational data and time-series hypertables.
- Deploy Redis to act as the backend for BullMQ message queues.
- Standardize the monorepo folder structure for all edge and service code.
- Establish the PostgreSQL relational schema required for Better Auth, Disease Tracking, and Anomaly Records.

**Non-Goals:**
- Creating the actual Dockerfiles and configurations for the individual microservices (e.g., `ingestion-service`, `intelligent-service`).
- Setting up the TimescaleDB hypertables for telemetry data (that relies on understanding the exact telemetry payload in the ingestion pipeline phase).
- Deploying to a production server (VPS) right now; this is strictly structural and for local `docker-compose up` enablement.

## Decisions

### 1. Unified `docker-compose.yml` for Infrastructure
* **Decision:** We will use a single, global `docker-compose.yml` file placed at the root of the project to orchestrate all base infrastructure (TimescaleDB, Mosquitto, Redis).
* **Rationale:** A unified compose file creates a shared network (`orchid-net`), allowing all future microservices (which will eventually be added to this compose file or run locally on the host) to communicate with these foundational services using resolvable container names. 
* **Alternatives Considered:** Running individual compose files in separate `infrastructure/` subfolders. This was rejected because it complicates network bridging and service discovery during local development.

### 2. Alpine Images for Base Services
* **Decision:** We will exclusively use lightweight Alpine Linux or similarly optimized images (e.g., `eclipse-mosquitto:latest`, `redis:alpine`, and the official TimescaleDB HA image).
* **Rationale:** Maximizes container spin-up speed and minimizes resource overhead on developer machines and eventual production VPS hosts.

### 3. Prisma as the Migration & Schema Engine
* **Decision:** We will use Prisma within an abstract "database" directory to manage our PostgreSQL relational schema migrations, even though services like the Go Analytic engine or the Python Intelligent engine might use raw SQL or different ORMs.
* **Rationale:** Prisma provides an excellent, readable schema representation (`schema.prisma`) and robust migration system. We can generate a generic SQL schema migration and apply it to the database cleanly, decoupling the schema definition from any specific language's ORM lock-in if needed, while seamlessly supporting the TypeScript services (Auth, Ingestion).
* **Trade-off:** Python and Go services cannot directly use the Prisma generated client. They will rely on standard database drivers (like `psycopg2` or `pgx`) and query the applied schema.

### 4. TimescaleDB over Standard PostgreSQL
* **Decision:** We deploy the `timescale/timescaledb:latest-pg17` extension instead of standard Postgres.
* **Rationale:** Our entire architecture depends heavily on edge node telemetry processing. Standard Postgres would rapidly degrade under the volume of time-series inserts.

## Risks / Trade-offs

* **[Risk] Stateful Volume Data Loss:** Dockerizing databases risks losing data if the volume mounts are not correctly configured or are accidentally pruned by developers. 
  * **Mitigation:** We will explicitly define named volumes in `docker-compose.yml` (e.g., `timescaledb-data`, `mosquitto-data`, `redis-data`) to prevent accidental destruction of state.
* **[Trade-off] Multi-Language Schema Management:** As decided above, using Prisma for the single source of truth for the schema means Go and Python services won't get auto-generated typings. We trade multi-language type safety for a highly readable and stable schema migration tool.
* **[Risk] Unsecured Mosquitto Broker:** By default, Mosquitto allows anonymous connections, which is dangerous if the VPS ports are exposed.
  * **Mitigation:** We will establish a basic `mosquitto.conf` disabling anonymous access and requiring a password file setup, securing edge-to-cloud communications.
