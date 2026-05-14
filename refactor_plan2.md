# SiapGrek Refactor Plan 2: Multi-Slave Architecture

## Objective
Refactor the SiapGrek IoT system to support a distributed sensor and actuator network under a single master node (`device_id`). The system must accommodate multiple slave sensors (e.g., soil sensors) and multiple actuators categorized by their control target (environment misting vs. soil watering).

---

## 1. MQTT Topic & Payload Redesign

### 1.1 Telemetry Payload
Instead of a rigid single-object structure, the payload will treat sensors as arrays of objects, allowing infinite scalability per master node.

**Topic:** `orchid/{device_id}/telemetry`

**Payload Schema:**
```json
{
  "timestamp": "2026-05-15T03:15:00Z",
  "environment": {
    "temperature": 27.3,
    "humidity": 68.5
  },
  "light": {
    "lux": 12450
  },
  "soil_sensors": [
    {
      "slave_id": "slave_1",
      "temperature": 24.8,
      "humidity": 71.2,
      "ph": 6.0,
      "ec": 1.5
    },
    {
      "slave_id": "slave_2",
      "temperature": 25.1,
      "humidity": 69.8,
      "ph": 6.2,
      "ec": 1.4
    }
  ]
}
```

### 1.2 Command Topics
Commands must specify both the **target kind** and the specific **actuator ID**.

**Topic Structure:** `orchid/{device_id}/command/{actuator_kind}/{actuator_id}`

**Examples:**
- `orchid/node1/command/misting/relay1` → payload `1` (Misting ON)
- `orchid/node1/command/misting/relay2` → payload `0` (Misting OFF)
- `orchid/node1/command/watering/valve1` → payload `1` (Soil Watering ON)

---

## 2. Database Schema Refactoring (`timescaledb` / Neon)

The current `telemetry` table is likely wide-column (one row = all sensor data). This must be normalized to support multiple slaves.

### Action Items:
1. **Environment Telemetry Table** (`env_telemetry`):
   - Stores `device_id`, `time`, `temperature`, `humidity`, `lux`.
   - `time` acts as the primary time-series column.
2. **Soil Telemetry Table** (`soil_telemetry`):
   - Stores `device_id`, `slave_id`, `time`, `temperature`, `humidity`, `ph`, `ec`.
   - `time` acts as the primary time-series column.
3. *(Optional)* **Actuator State Table**: Track the state of `misting` and `watering` relays over time.

---

## 3. Microservice Updates

### 3.1 Ingestion Service (`ingestion-service`)
- Update the **Zod Validation Schema** to parse the new array-based payload.
- Update the **Database Insertion Logic** to handle relational inserts. Instead of a single SQL `INSERT`, split the payload and insert the environment data into `env_telemetry` and loop over `soil_sensors` to insert into `soil_telemetry`.

### 3.2 Analytic Service (`analytic-service`)
- Update SQL queries in the Go handlers (`/api/v1/telemetry/latest`, `/api/v1/telemetry/history`).
- Ensure the API response aggregates multiple soil sensors (e.g., returning an array of soil readings or a computed average if requested by the frontend).
- Add new endpoints to query specific `slave_id` data if needed.

### 3.3 Knowledge Service (`knowledge-service`)
- Update the MCP Tools (`latest_sensor_data`, `sensor_history`).
- The LLM should receive context that there are *multiple* soil sensors. Example format: "Environment Temp: 27°C. Soil A (slave_1): 71% hum. Soil B (slave_2): 69% hum."

### 3.4 Intelligent Service (`intelligent-service`)
- *No immediate changes needed* since fuzzy logic and anomaly detection were removed. Disease classification (image-based) remains unaffected by telemetry payload changes.

### 3.5 Frontend
- Update data fetching types to match the new backend responses.
- Update UI charts and cards to display multiple soil sensors (e.g., a dropdown to select a slave sensor, or overlapping chart lines).

---

## Proposed Execution Phases

### Phase 1: Infrastructure & Ingestion
- [ ] Migrate database schema in Postgres (split into `env_telemetry` and `soil_telemetry`).
- [ ] Update `openspec/config.yaml` to reflect the new payload and command structures.
- [ ] Update `ingestion-service` Zod schemas and DB batch logic.

### Phase 2: Data Access & API
- [ ] Update `analytic-service` SQL queries to join/fetch the new table structures.
- [ ] Test the `/telemetry/latest` and `/telemetry/history` endpoints.

### Phase 3: AI & Frontend
- [ ] Update `knowledge-service` MCP tools so the LLM understands multi-slave readings.
- [ ] Update `frontend` UI to visualize multi-slave data and send commands to specific misting/watering relays.
