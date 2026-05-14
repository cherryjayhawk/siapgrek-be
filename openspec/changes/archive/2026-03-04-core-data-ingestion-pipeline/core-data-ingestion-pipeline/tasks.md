## 1. Project Initialization & Dependencies

- [x] 1.1 **Initialize Bun Project**: Scaffold the `ingestion-service` directory. Run `bun init` to generate `package.json` and create an `.env.example` file. 
  - *Targets*: `services/ingestion-service/package.json`, `services/ingestion-service/.env.example`
  - *Acceptance*: A clean Bun project structure exists.
- [x] 1.2 **Install Dependencies**: Install core packages (`mqtt`, `zod`, `bullmq`, `postgres` or `pg`) and necessary type definitions.
  - *Targets*: `services/ingestion-service/package.json`
  - *Acceptance*: Dependencies are saved to `package.json`.
- [x] 1.3 **TypeScript Configuration**: Set up a strict `tsconfig.json` and the main entrypoint.
  - *Targets*: `services/ingestion-service/tsconfig.json`, `services/ingestion-service/src/index.ts`
  - *Acceptance*: `bun run src/index.ts` runs successfully without type errors.

## 2. Core Validation & Types

- [x] 2.1 **Telemetry Zod Schema**: Define strict validation schema matching `{ soil, environment, light, timestamp }` and infer the TypeScript types.
  - *Targets*: `services/ingestion-service/src/schemas/telemetry.schema.ts`
  - *Acceptance*: Valid payload passes, missing or malformed fields throw Zod errors.
- [x] 2.2 **Validator Utility**: Create a safe parsing wrapper that accepts raw MQTT message buffers/strings.
  - *Targets*: `services/ingestion-service/src/utils/validator.ts`
  - *Acceptance*: Returns successfully parsed data or logs error details and returns `null` without throwing an unhandled exception.

## 3. Storage & Buffering Logic

- [x] 3.1 **Telemetry Buffer Class**: Implement `TelemetryBuffer` to hold validated readings in memory. It must extract the `device_id` from the incoming MQTT topic and construct the final object.
  - *Targets*: `services/ingestion-service/src/buffer/TelemetryBuffer.ts`
  - *Acceptance*: Can safely `push` new readings and `flush` (return contents and empty the internal array).
- [x] 3.2 **Buffer Overload Protection**: Add an upper-bound length check (e.g., 50,000 max size) to the `push` method.
  - *Targets*: `services/ingestion-service/src/buffer/TelemetryBuffer.ts`
  - *Acceptance*: Exposing an event or callback when the limit is breached to execute an immediate flush.

## 4. TimescaleDB Integration

- [x] 4.1 **Database Client**: Set up a connection pool instance mapped to the TimescaleDB environment variables.
  - *Targets*: `services/ingestion-service/src/db/client.ts`
  - *Acceptance*: Successfully connects to the `timescaledb` host inside the docker network.
- [x] 4.2 **Batch Insert Logic**: Implement the bulk `INSERT INTO telemetry (device_id, timestamp, soil_temperature, ...) VALUES ... ON CONFLICT DO NOTHING` logic.
  - *Targets*: `services/ingestion-service/src/db/repository.ts`
  - *Acceptance*: Function accepts an array of readings, constructs a parameterized bulk query natively, executes it, and returns the start/end timestamps of the inserted batch.

## 5. BullMQ & Event Publisher Integration

- [x] 5.1 **Redis Connection & Producer**: Initialize BullMQ's `Queue` class targeting the `anomaly-detection` queue backed by the `redis` host.
  - *Targets*: `services/ingestion-service/src/queue/producer.ts`
  - *Acceptance*: Queue instance connects perfectly to Redis on startup without crashing.
- [x] 5.2 **Emit Batch Event Function**: Implement `emitBatchEvent(start, end)` payload dispatch. Wrap entirely in a `try/catch`.
  - *Targets*: `services/ingestion-service/src/queue/producer.ts`
  - *Acceptance*: Successful dispatch logs "Event Added", while Redis connection failures purely log "Redis Failure" as an error and continue execution.

## 6. Main Flow & MQTT Consumer

- [x] 6.1 **MQTT Client Module**: Configure the Mosquitto MQTT client. Connect with retry logic and listen explicitly to `orchid/+/telemetry`.
  - *Targets*: `services/ingestion-service/src/mqtt/client.ts`
  - *Acceptance*: Service logs "MQTT Connected" and receives active payloads when mocked payload is published to the broker.
- [x] 6.2 **Orchestrating Ingestion**: Wire the MQTT `message` event to the Zod validator. Valid payloads get pushed into the `TelemetryBuffer`.
  - *Targets*: `services/ingestion-service/src/mqtt/client.ts`
  - *Acceptance*: An integration test / mocked message flows from topic -> validator -> buffer array.
- [x] 6.3 **Timer Hookup**: Inside `index.ts`, use `setInterval` at 5 minutes to trigger the full flush. Retrieve array from `TelemetryBuffer` -> Call Batch Insert -> Call BullMQ `emitBatchEvent` if successful query. Also wire the forced flush callback.
  - *Targets*: `services/ingestion-service/src/index.ts`
  - *Acceptance*: Complete loop handles incoming data, groups it, flushes cleanly after 5m, and queues a job.
- [x] 6.4 **Dockerization**: Construct `services/ingestion-service/Dockerfile` using `oven/bun:alpine`. Ensure it compiles and runs standalone. Ensure `docker-compose.yml` hooks the service up.
  - *Targets*: `services/ingestion-service/Dockerfile`, `docker-compose.yml`
  - *Acceptance*: `docker compose up ingestion-service -d` builds the image and runs reliably alongside the mosquitto broker and db.
