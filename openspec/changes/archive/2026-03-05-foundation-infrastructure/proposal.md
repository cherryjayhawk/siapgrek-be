## Why

The Greenhouse Orchid IoT System relies on a distributed architecture that requires a robust foundational infrastructure before any microservices or edge logic can be implemented. Establishing the base Docker Compose network, monorepo structure, and core database schemas now ensures that subsequent phases have the necessary environment, database, and messaging capabilities to operate, preventing integration blockers and providing a unified development setup.

## What Changes

- Initialize the global monorepo folder structure to organize edge code and backend microservices.
- Create the global `docker-compose.yml` to orchestrate `mosquitto` (MQTT Broker), `timescaledb` (Time-Series and Relational DB), and `redis` (Pub/Sub Event Queue).
- Define global `.env` configurations for consistent environment variables across services.
- Establish the core relational database schema via migrations for Auth, Disease, and Anomaly tracking.

## Non-goals

- Implementing the actual microservices (ingestion, knowledge, intelligent, analytic, auth).
- Writing or flashing edge logic for the ESP32 nodes.
- Setting up the CI/CD deployment pipeline.
- Establishing the TimescaleDB hypertables for telemetry data (this will be handled in the ingestion pipeline phase).

## Capabilities

### New Capabilities
- `docker-infrastructure`: Defining the base containerized environment (Mosquitto, TimescaleDB, Redis) and their network interactions.
- `database-schema`: The foundational relational schema definition for User Authentication, Disease Logs, and Anomaly Records.

### Modified Capabilities

## Impact

- **Architecture:** Establishes the core local and production-ready operational environment.
- **Dependencies:** Introduces Docker Compose as the main orchestration tool and TimescaleDB, Redis, Mosquitto as the foundational data dependencies.
- **Codebase:** Lays out the initial monorepo scaffolding which will dictate where all future code resides in subsequent phases.
