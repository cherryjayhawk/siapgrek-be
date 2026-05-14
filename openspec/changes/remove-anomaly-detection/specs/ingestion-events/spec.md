## REMOVED Requirements

### Requirement: BullMQ Job Queue Configuration
**Reason**: Anomaly detection was removed and there are currently no other asynchronous consumers acting upon the telemetry batch saves.
**Migration**: Remove BullMQ and Redis connection configuration utilized for the `anomaly-detection` queue inside the `ingestion-service`.

### Requirement: Event Emission on Successful Batch Save
**Reason**: Since anomaly detection is removed, there's no need to trigger batch processing in downstream systems.
**Migration**: Remove event emission routines from the 5-minute bulk insert workflow.

### Requirement: Error Handling for Queue Failures
**Reason**: Queue is completely removed.
**Migration**: Delete corresponding error handlers relating to BullMQ Redis failures.
