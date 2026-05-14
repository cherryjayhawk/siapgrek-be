## 1. Database Schema Updates

- [x] 1.1 Remove the `anomaly_record` model from `database/prisma/schema.prisma`.
- [x] 1.2 Regenerate Prisma client across dependent services (e.g., `knowledge-service`).

## 2. Ingestion Service Updates

- [x] 2.1 Remove BullMQ producer queue initialization (`anomaly-detection`) from `services/ingestion-service/src/index.ts`.
- [x] 2.2 Remove the batch event emission payload and Redis error handling logic that triggered the down-stream anomaly detection.

## 3. Intelligent Service Updates

- [x] 3.1 Remove the BullMQ consumer/worker for parsing batch anomaly detections in `services/intelligent-service`.
- [x] 3.2 Remove the manual anomaly detection API endpoint and controller functions inside `services/intelligent-service`.
- [x] 3.3 Delete anomaly detection TensorFlow Lite models located in `services/intelligent-service/models/` and all their loader logic.
- [x] 3.4 Prune Python environment properties associated only with the anomaly inference logic.

## 4. Knowledge Service Updates

- [x] 4.1 Remove the `Anomaly Record` MCP Tool and server resource definitions from `services/knowledge-service`.
- [x] 4.2 Clean up any remaining TypeScript types or database queries that referenced the `anomaly_record` table in the knowledge service.
