## ADDED Requirements

### Requirement: Local container orchestration via Docker Compose
The system MUST provide a single root `docker-compose.yml` file that orchestrates the Mosquitto MQTT broker, TimescaleDB, and Redis.

#### Scenario: Developer brings up local environment
- **WHEN** a developer runs `docker-compose up`
- **THEN** Mosquitto, TimescaleDB, and Redis containers start successfully on a shared `orchid-net` network with persistent volumes attached.

### Requirement: MQTT Broker Security
The Mosquitto MQTT broker MUST NOT allow anonymous access by default and MUST require configuration to secure edge-to-cloud communications.

#### Scenario: Client connects to MQTT broker without credentials
- **WHEN** a client attempts to connect to Mosquitto anonymously
- **THEN** the connection is rejected (as per the configured `mosquitto.conf`).
