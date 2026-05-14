## Context

The Greenhouse Orchid IoT System is progressing to Phase 6, requiring a Core AI Intelligence layer to process ingested telemetry. Currently, the system successfully gathers and stores high-throughput sensor data (via `ingestion-service` and TimescaleDB). However, there is no automated, intelligent feedback loop returning to the edge actuators. To create an active, autonomous environment, we need a service dedicated to running classification models (disease and anomaly detection) and computing control actions via advanced logic.

## Goals / Non-Goals

**Goals:**
*   Implement a Python 3.12 microservice (`intelligent-service`) using FastAPI and `uv` for dependency management.
*   Integrate TensorFlow Lite (`.tflite`) endpoints for real-time inference to classify anomalies and predict diseases from environmental telemetry.
*   Consume telemetry queues efficiently from the `ingestion-service` using a background worker (connecting to BullMQ/Redis).
*   Construct a Fuzzy Logic controller that actively calculates environmental correction signals and publishes them as MQTT override commands to edge actuators.

**Non-Goals:**
*   Running ML inferences directly on the ESP32 edge environment (Edge ML).
*   Implementing Large Language Model (LLM) or RAG-based natural language APIs (this belongs to the future Phase 7).
*   Creating a user interface for these actuator signals; this is strictly backend-to-edge communication.

## Decisions

*   **Runtime & Framework**: Python 3.12 with FastAPI and `uv`.
    *   *Rationale*: Python is the standard for machine learning orchestration. FastAPI provides a high-performance async web framework suitable for APIs, while `uv` ensures fast, reliable, and reproducible environment resolution.
*   **Decoupled Worker Interaction**: Telemetry processing will occur via a BullMQ-compatible Python worker (or FastAPI background task integration) reading from Redis, rather than synchronous HTTP requests.
    *   *Rationale*: Decoupling prevents the ingestion pipeline from being blocked by heavy ML inferences.
*   **ML Execution**: TensorFlow Lite (`.tflite`).
    *   *Rationale*: The service runs in a containerized Docker cluster on a VPS. Full TensorFlow is overly heavy. TFLite provides a compact binary footprint with sufficiently fast CPU inference for structured IoT data.
*   **Control Strategy**: Fuzzy Logic unit for control signals.
    *   *Rationale*: Greenhouse environments are non-linear (temperature and humidity are tightly coupled). Fuzzy inference handles this uncertainty far better than basic threshold-based PID algorithms.
*   **Event Flow Sequence**:
    1.  `ingestion-service` validates incoming MQTT payloads and saves to DB.
    2.  `ingestion-service` pushes a job ID + payload to BullMQ (Redis).
    3.  `intelligent-service` worker consumes the generic or anomalism job.
    4.  Worker feeds data through `.tflite` model (and/or Fuzzy Logic).
    5.  If action is required, `intelligent-service` publishes a command payload directly back to Mosque MQTT (`actuators/target`).

## Risks / Trade-offs

*   **Message Queuing Latency**: While asynchronous processing via BullMQ prevents ingestion blocking, it could slightly delay actuator response under heavy burst loads. We mitigate this by ensuring inference times are sub-50ms using TFLite, and ensuring workers can be scaled if queue depth grows.
*   **Queue Backpressure**: If inferences fail constantly, the queue could stall. Strict fault-isolation mechanisms, robust error-handling logic around the TFLite runtime, and dead-letter queues must be implemented.
*   **Edge Fallbacks**: What happens if `intelligent-service` goes offline? Edge nodes MUST implement a local safe-state fallback (e.g., reverting to a simple thermostat rule) if a keep-alive or control signal from the cloud is missed for > 5 minutes.
*   **Python/Redis Worker Interop**: Native BullMQ is Node-based. The Python worker will need to integrate correctly using a Python port or compatible Redis streams structure to ensure reliable consumption from the `ingestion-service`.
