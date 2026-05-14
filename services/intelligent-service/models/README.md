# Model Assets

Place your trained model files here:

## Disease Classification (Direct pipeline)
- `model_cnn_finetuned_V3.tflite` — Fine-tuned TFLite CNN that predicts directly from 224×224 RGB plant images
- Labels: `BERCAK DAUN`, `BUSUK DAUN`, `SEHAT`

## Anomaly Detection (telemetry-based)
- `anomaly_detection.tflite` — TFLite model for detecting anomalous sensor readings
- Labels: `normal`, `anomaly`
