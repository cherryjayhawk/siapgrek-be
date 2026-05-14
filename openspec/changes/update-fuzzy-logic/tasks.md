## 1. Database Schema Update

- [x] 1.1 Add `CommandLog` model to `database/prisma/schema.prisma` with fields: `id`, `timestamp`, `deviceId`, `actuator`, `commandValue`, and `source`
- [x] 1.2 Run Prisma migration to apply the schema change (`npx prisma migrate dev --name add_command_log`)

## 2. Intelligent Service Refactor (Python MQTT)

- [x] 2.1 Remove Redis Pub/Sub subscription and connection logic from `services/intelligent-service`.
- [x] 2.2 Add an MQTT Client to `services/intelligent-service` that subscribes to `orchid/+/telemetry`.
- [x] 2.3 Modify the internal fuzzy logic router to ignore `soil.ph` and `soil.ec` during evaluations. 
- [x] 2.4 Publish the evaluated binary actuation state to the MQTT broker using topic `orchid/{device_id}/command/{actuator}`.

## 3. Ingestion Service Refactor (Database Logger)

- [x] 3.1 Update the `services/ingestion-service` MQTT Client to ALSO subscribe to `orchid/+/command/+`.
- [x] 3.2 Add a message handler in `services/ingestion-service` that parses the command topic to extract `device_id` and `actuator`, then writes the payload to the `CommandLog` Prisma table.
