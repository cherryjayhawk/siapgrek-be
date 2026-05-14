## 1. Project Initialization & Setup

- [x] 1.1 **Initialize `intelligent-service` Directory**: Create the `services/intelligent-service` folder. Initialize a new Python project using `uv` (e.g., `uv init --python 3.12 .`). Setup basic `.gitignore`, `.env.example`, and `README.md`.
- [x] 1.2 **Install Core Dependencies**: Use `uv` to install `fastapi`, `uvicorn`, `redis` (or a BullMQ-compatible Python port like `bullmq-python`), `paho-mqtt` (for MQTT), `tflite-runtime` (or `tensorflow-cpu`), and `pydantic`.
- [x] 1.3 **Docker Setup**: Create a `Dockerfile` for the service utilizing an official Python 3.12 slim or alpine image. Add the service to the global `docker-compose.yml` under an `intelligent-service` block, linking it to the `redis` and `mosquitto` networks.

## 2. ML Inference (TFLite) Integration

- [x] 2.1 **Create Model Asset Directory**: Create `services/intelligent-service/models/` and add placeholder (or actual) `.tflite` model files for testing (e.g., `disease_classification.tflite`, `anomaly_detection.tflite`).
- [x] 2.2 **Implement Inference Service Layer**: Create `services/intelligent-service/app/services/ml_service.py`. Implement a class to load a `.tflite` model via `tflite_runtime.interpreter`, allocate tensors, and provide a `predict(data)` method.
- [x] 2.3 **Implement Fallback/Error Handling**: Modify `ml_service.py` to gracefully catch `FileNotFoundError` or runtime inference execution errors, logging the error and returning a safe fallback (e.g., `{"status": "safe", "confidence": 1.0, "error": "Model failed to load"}`). Provide a simple API route in `main.py` to test.

## 3. Worker (BullMQ/Redis) Integration

- [x] 3.1 **Establish Redis Connection**: Create `services/intelligent-service/app/core/redis.py` to initialize a Redis client connection using connection strings from `.env`.
- [x] 3.2 **Implement BullMQ Worker**: Create `services/intelligent-service/app/worker.py`. Implement a worker that listens to a specific Redis queue (e.g., `telemetry-ingestion-queue`). Parse incoming payload strings into Pydantic models.
- [x] 3.3 **Hook Inference to Worker**: In `worker.py`, pass the parsed payload to the `ml_service` to retrieve a classification result. Acknowledge the job if successful.
- [x] 3.4 **Worker Error Handling/Retry**: Ensure the worker correctly catches any exceptions from the ML service or parsing, logs the error, and marks the Redis job as failed.

## 4. Fuzzy Control & MQTT Publish

- [x] 4.1 **Implement Fuzzy Logic Unit**: Create `services/intelligent-service/app/services/fuzzy_service.py`. Implement the fuzzy rule logic evaluating temperature and humidity inputs against thresholds to output actionable levels (e.g., `fan_speed=100`, `mist=True`).
- [x] 4.2 **Implement MQTT Publisher**: Create `services/intelligent-service/app/core/mqtt.py`. Implement a client using `paho-mqtt` to connect to the Mosquitto broker defined in `.env`. Expose a `publish_override(device_id, payload)` method.
- [x] 4.3 **Integrate Control Loop in Worker**: After the worker calls the `ml_service` (or simultaneously), pass the telemetry to the `fuzzy_service`. If the fuzzy output demands an override, call `mqtt.publish_override()` to send a JSON command payload to `actuators/<device_id>/command`.
- [x] 4.4 **Handle Disconnections**: Ensure `mqtt.py` gracefully handles broker disconnections, logging an error without crashing the worker process, adhering to the "Graceful Fallback Isolation" requirement.

## 5. Main Application & Lifecycle

- [x] 5.1 **FastAPI Application Assembly**: Assemble `services/intelligent-service/app/main.py`. Ensure the `worker` tasks and `mqtt` connections are properly started and stopped using FastAPI's lifespan events (`@asynccontextmanager`).
- [x] 5.2 **Health / Integration Testing**: Add a basic `/health` endpoint to `main.py`. Verify the Docker container builds and starts, and that manually dropping a message into the Redis queue triggers the worker -> inference -> mqtt pipeline.
