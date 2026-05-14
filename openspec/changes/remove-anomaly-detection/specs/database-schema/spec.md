## MODIFIED Requirements

### Requirement: AI Domain Tracking Tables
The database MUST contain the `disease_log` table to permanently store machine learning inference results.

#### Scenario: Intelligent service records a disease logs
- **WHEN** the intelligence pipeline evaluates disease classifications
- **THEN** it accurately saves a record to the `disease_log` table.

## REMOVED Requirements

### Requirement: AI Domain Tracking Tables (Anomaly Detection scenario)
**Reason**: Anomaly detection logic is deprecated to streamline the architecture and free up backend resources.
**Migration**: Remove `anomaly_record` from the Prisma schema and the corresponding TimescaleDB tables.
