## ADDED Requirements

### Requirement: TFLite Model Execution
The service must load and execute `.tflite` models to perform inference on incoming telemetry data, classifying instances of disease or environment anomalies with low latency.

#### Scenario: Successful Anomaly Detection
- **WHEN** incoming telemetry is passed to the loaded TFLite model
- **THEN** it must return an inference result (classification label and confidence score) in under 100ms.

### Requirement: Error Handling for Missing or Corrupt Models
The service must fail gracefully if a specified `.tflite` model file is damaged or not found, preventing a crash of the main application lifecycle.

#### Scenario: Missing model file
- **WHEN** the service attempts to load a non-existent model file during startup or inference
- **THEN** it must log an error and return a safe default prediction (e.g., normal state) or an appropriate error response.
