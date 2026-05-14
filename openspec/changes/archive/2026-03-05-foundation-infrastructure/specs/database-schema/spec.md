## ADDED Requirements

### Requirement: Prisma Schema Definition
The system MUST use Prisma to define the core PostgreSQL relational schema, mapping User, Session, Disease, and Anomaly domain entities within a centralized location.

#### Scenario: Running database migrations
- **WHEN** a developer runs Prisma migration commands locally
- **THEN** the core SQL tables for Auth, Disease tracking, and Anomaly records are created or updated in TimescaleDB cleanly.

### Requirement: Authentication Tables for Better Auth
The database MUST contain `user` and `session` tables compatible with Better Auth requirements for JWT session identity centralized management.

#### Scenario: System creates authentication tokens
- **WHEN** the Auth Service attempts to store or validate a new user session
- **THEN** the backend correctly persists or fetches the data directly from the unified `session` and `user` PostgreSQL tables.

### Requirement: AI Domain Tracking Tables
The database MUST contain `disease_log` and `anomaly_record` tables to permanently store machine learning inference results and sensor threshold anomalies.

#### Scenario: Intelligent service records an anomaly
- **WHEN** the intelligence pipeline evaluates anomalous telemetry 
- **THEN** it accurately saves a record to the `anomaly_record` table containing the `timestamp`, `device_id`, `sensor`, `recorded_value`, `threshold_value`, and `resolved` status.
