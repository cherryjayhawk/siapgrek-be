## 1. DB Implementation Adjustments

- [x] 1.1 Update `c:\dev\nodejs\siapgrek\services\ingestion-service\src\db\repository.ts` to expose an `insertTelemetrySingle` function. This should insert a single `SensorReading` directly into the database using `postgres.js` instead of handling an array.
- [x] 1.2 Update the return signatures from the DB file so that the newly inserted row data (or a standardized response) can be passed to the event publisher.

## 2. Queue and Eventing Restructure

- [x] 2.1 Remove `bullmq` from `c:\dev\nodejs\siapgrek\services\ingestion-service\package.json` dependencies if it is only used here and switch/install `ioredis` for standard redis operations if not already present.
- [x] 2.2 Refactor `c:\dev\nodejs\siapgrek\services\ingestion-service\src\queue\producer.ts` into a Redis Pub/Sub publisher logic. Rename exported methods like `emitBatchEvent` to `emitTelemetryEvent` stringifying the inserted payload and publishing it to the `telemetry:inserted` Redis channel.

## 3. Streaming Pipeline Updates

- [x] 3.1 Remove `c:\dev\nodejs\siapgrek\services\ingestion-service\src\buffer\TelemetryBuffer.ts` entirely as the in-memory batch mechanism is no longer needed.
- [x] 3.2 Update `c:\dev\nodejs\siapgrek\services\ingestion-service\src\mqtt\client.ts`'s message handler to await `insertTelemetrySingle` and `emitTelemetryEvent` directly upon payload validation, replacing any calls to `buffer.push()`.
- [x] 3.3 Refactor `c:\dev\nodejs\siapgrek\services\ingestion-service\src\index.ts` to remove all buffer initialization, overflow callback listeners, and the 5-minute `setInterval` flush timer. The `index.ts` should now merely initialize the DB, the Redis Publisher, and the MQTT client.
