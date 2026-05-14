## ADDED Requirements

### Requirement: BullMQ Asynchronous Consumption
The service must connect to Redis and process jobs queued by the `ingestion-service` using a BullMQ-compatible worker paradigm to decouple inference logic from the main telemetry ingestion pipeline.

#### Scenario: Processing queued telemetry
- **WHEN** the `ingestion-service` adds a batch of telemetry to the Redis queue
- **THEN** the intelligent-service worker must dequeue the job, parse the payload, and invoke the inference engine asynchronously.

### Requirement: Resilient Error Handling & Retry Logic
Queue processing must be fault-tolerant, ensuring that failing inference requests do not infinitely crash the worker or lose data.

#### Scenario: Inference runtime failure
- **WHEN** an error occurs during model execution for a processed job
- **THEN** the worker must catch the exception, log the failure, and mark the job as failed in Redis (utilizing standard retries or dead-letter queue routing if configured).
