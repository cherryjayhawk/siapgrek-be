## Why

This change initiates Phase 6 of the Greenhouse Orchid IoT System by implementing the Core AI Intelligence layer. It establishes the `intelligent-service` to process ingested telemetry, provide AI-driven disease and anomaly classification, and enable automated fuzzy logic control. This creates an active feedback loop from the cloud down to the edge actuators based on advanced machine learning inferences.

## What Changes

- Create the `intelligent-service` application utilizing Python 3.12, FastAPI, and `uv` for dependency management.
- Integrate TensorFlow Lite (`.tflite`) endpoints for performing disease and anomaly classification on incoming data.
- Hook up a background BullMQ worker to consume telemetry events asynchronously from the `ingestion-service` pipeline.
- Construct a Service-level Fuzzy Logic unit to actively compute and publish MQTT command overrides down to Edge layer actuators.

## Capabilities

### New Capabilities

- `ml-inference`: TensorFlow Lite-based endpoints for executing disease and anomaly classification models.
- `background-processing`: BullMQ worker integration to consume and process telemetry event streams asynchronously.
- `fuzzy-control`: Service-level fuzzy logic unit for computing control actions and publishing MQTT command overrides to the Edge layer.

### Modified Capabilities

- None

## Impact

- **Microservices**: Introduces the new `intelligent-service` to the monorepo architecture.
- **Messaging Pipeline**: Connects the new service to Redis (via BullMQ) as a consumer, and to the MQTT broker as a publisher.
- **Edge Devices**: Edge actuators will begin receiving automated control override signals from the intelligence layer via MQTT.

## Non-goals

- Deploying ML models directly to edge hardware instances (Edge ML inference).
- Providing comprehensive natural language agricultural insights (RAG integration, which belongs to Phase 7).
