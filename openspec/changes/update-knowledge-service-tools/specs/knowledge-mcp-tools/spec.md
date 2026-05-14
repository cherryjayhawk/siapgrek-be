## ADDED Requirements

### Requirement: Weather Forecast Tool
The Knowledge Service MUST provide an MCP tool named `weather_forecast` that accepts `lat` (latitude) and `lon` (longitude) coordinates to fetch weather data from OpenWeatherMap.

#### Scenario: Successful forecast retrieval
- **WHEN** the tool is invoked with valid `lat` and `lon`
- **THEN** the server fetches forecast from `api.openweathermap.org/data/2.5/forecast` using `OPENWEATHERMAP_API_KEY`
- **THEN** the server returns the JSON forecast context as an MCP text response

#### Scenario: Missing API Key
- **WHEN** the tool is invoked but `OPENWEATHERMAP_API_KEY` is not set in `.env`
- **THEN** the server returns a graceful error message indicating the API key is unconfigured, avoiding a crash

### Requirement: Latest Sensor Data Tool
The Knowledge Service MUST provide an MCP tool named `latest_sensor_data` that retrieves the absolute latest environmental and soil telemetry row from TimescaleDB.

#### Scenario: Fetching global latest telemetry
- **WHEN** the tool is invoked without a specific `device_id`
- **THEN** the server queries the `telemetry` table ordered by `timestamp` descending with limit 1
- **THEN** the server returns the resulting row context as an MCP text response

#### Scenario: Fetching device-specific latest telemetry
- **WHEN** the tool is invoked with a specific `device_id`
- **THEN** the server filters the query by `device_id` and limit 1
- **THEN** the server returns the resulting row context

#### Scenario: No telemetry available
- **WHEN** the tool is invoked but the database is completely empty
- **THEN** the server returns a message stating no telemetry could be found

## REMOVED Requirements

### Requirement: Anomaly Record Tool
**Reason**: Deprecated because raw anomaly records are no longer accessed directly through this MCP query pattern by the Intelligent Service.
**Migration**: The tool `anomaly_record` will be entirely removed from the MCP server registration. Clients formerly relying on it must parse anomalies differently or via distinct REST endpoints.
