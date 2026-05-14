# intelligent-service

Core AI Intelligence layer for the Greenhouse Orchid IoT System.

## Stack

- **Runtime**: Python 3.12
- **Framework**: FastAPI + Uvicorn
- **ML Engine**: TensorFlow Lite (`.tflite`)
- **Queue**: Redis Pub/Sub (consuming from `ingestion-service`)
- **Control**: Fuzzy Logic → MQTT command overrides
- **Package Manager**: `uv`

## Development

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 3003
```

## Docker

```bash
docker compose up intelligent-service
```
