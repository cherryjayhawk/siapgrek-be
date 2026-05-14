## ADDED Requirements

### Requirement: Preference MCP Tool
The system SHALL expose an MCP Tool named `preference` that reads context from uploaded `.md` files.

#### Scenario: Accessing User Preference
- **WHEN** the LLM client queries the `preference` tool with a topic parameter
- **THEN** the MCP server retrieves relevant text from the uploaded agricultural knowledge documents and returns it as plain text context.

### Requirement: Sensor History MCP Tool
The system SHALL expose an MCP Tool named `sensor_history` to query historical read sensor data from TimescaleDB.

#### Scenario: Fetching Environmental History
- **WHEN** the LLM queries the `sensor_history` tool with a time constraint
- **THEN** the MCP server issues a SQL query to the `telemetry` table in TimescaleDB and returns aggregated historical data.

### Requirement: Disease Log MCP Tool
The system SHALL expose an MCP Tool named `disease_log` to retrieve past disease classification results from PostgreSQL.

#### Scenario: Checking for Past Diseases
- **WHEN** the LLM queries the `disease_log` tool for a specific device or time range
- **THEN** the MCP server retrieves rows from the `disease_log` table in PostgreSQL.

### Requirement: Anomaly Record MCP Tool
The system SHALL expose an MCP Tool named `anomaly_record` to retrieve recorded anomalies from PostgreSQL.

#### Scenario: Investigating Environmental Anomalies
- **WHEN** the LLM queries the `anomaly_record` tool for historical alerts
- **THEN** the MCP server queries the `anomaly_record` table in PostgreSQL and returns the details.
