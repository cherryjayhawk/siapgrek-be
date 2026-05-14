## Why

The Knowledge Service needs updated Model Context Protocol (MCP) tools to better provide relevant operational context to the Intelligent Service and LLM integration. The anomaly logs tool is being removed. To provide context about external environmental conditions, a new weather forecast capability via OpenWeatherMap (fetched by coordinate: latitude and longitude) is introduced. Additionally, a tool to fetch the latest sensor data is required to give the LLMs the immediate, real-time snapshot of conditions without querying historical aggregates.

## What Changes

- Remove the existing anomaly logs server tool (`anomaly_record`).
- Add a new `weather_forecast` MCP tool that queries the OpenWeatherMap API using latitude and longitude coordinates.
- Add a new `latest_sensor_data` MCP tool that fetches the most recent telemetry reading.
- **BREAKING**: LLMs and MCP clients will no longer be able to query anomaly records directly via this specific tool.

## Capabilities

### New Capabilities
- `knowledge-mcp-tools`: Defines the array of MCP tools exposed by the Knowledge Service (weather forecast via lat/long, latest sensor data).

### Modified Capabilities


## Non-goals

- Altering the Intelligent Service logic or how it interprets the tool responses.
- Integrating weather providers other than OpenWeatherMap.
- Changing historical sensor data tool behavior.

## Impact

- `services/knowledge-service/src/mcp/tools.ts` and related server handlers.
- `.env` configuration (addition of OpenWeatherMap API Key).
- Knowledge Service dependencies (may need an HTTP client or fetch logic for OpenWeatherMap if not already present).
