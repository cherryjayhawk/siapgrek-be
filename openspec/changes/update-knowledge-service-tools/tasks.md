## 1. Environment and Config Updates

- [x] 1.1 Add `OPENWEATHERMAP_API_KEY` placeholder entry to the global `.env` file and ensure the Knowledge Service reads it. (Path: `.env`)

## 2. MCP Tools Cleanup and Addition

- [x] 2.1 Remove the `anomaly_record` tool entirely from the Knowledge Service. (Path: `services/knowledge-service/src/mcp/tools.ts`)
- [x] 2.2 Implement the `latest_sensor_data` MCP tool using a direct DB query to `telemetry` table (ORDER BY timestamp DESC LIMIT 1). Support optional `device_id` filtering. (Path: `services/knowledge-service/src/mcp/tools.ts`)
- [x] 2.3 Implement the `weather_forecast` MCP tool using native Bun `fetch` for OpenWeatherMap integration via `lat` and `lon`. Include graceful fallback/error response if the API key is missing. (Path: `services/knowledge-service/src/mcp/tools.ts`)
