"""
intelligent-service — FastAPI Application Entry Point.

Manages the application lifecycle:
  - Initializes database schema
  - Loads TFLite disease classification model
  - Starts MQTT telemetry worker (fuzzy control)
  - Exposes /health, /predict, /predictions endpoints
"""

import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, File, UploadFile, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.core.config import (
    DISEASE_MODEL_PATH,
)
from app.core.database import engine, get_db, SessionLocal
from app.db.models import Base, DiseaseLog, InsightLog

from app.services.fuzzy_service import FuzzyController
from app.services.ml_service import MLService
from app.worker import TelemetryWorker
from app.mcp_client import MCPClient
from app.insights import InsightOrchestrator, InsightResult
from app.schemas import InsightRequest, InsightResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Upload directory for disease images
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan manager.
    """
    logger.info("=== intelligent-service starting ===")

    # 0. Database
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")

    # 1. ML models (disease classification only)
    ml_service = MLService(
        disease_tflite_path=DISEASE_MODEL_PATH,
    )
    ml_service.load_models()

    # 2. Fuzzy controller
    fuzzy_controller = FuzzyController()

    # 3. Telemetry worker (MQTT-based fuzzy control)
    worker = TelemetryWorker(
        fuzzy_controller=fuzzy_controller,
    )
    await worker.start()

    # 4. MCP client (connects to knowledge-service)
    mcp_client = MCPClient()
    await mcp_client.connect()

    # 5. Insight orchestrator
    insight_orchestrator = InsightOrchestrator(mcp_client)

    # Store refs on app.state so routes can access them
    app.state.ml_service = ml_service
    app.state.worker = worker
    app.state.mcp_client = mcp_client
    app.state.insight_orchestrator = insight_orchestrator

    yield

    # --- Shutdown ----------------------------------------------------------
    logger.info("=== intelligent-service shutting down ===")
    await mcp_client.disconnect()
    await worker.stop()


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="intelligent-service",
    description="Core AI Intelligence layer — ML inference, fuzzy control, MQTT overrides",
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Background Tasks
# ---------------------------------------------------------------------------
def background_save_prediction(
    filename: str,
    file_path: str,
    prediction: str,
    class_index: int,
    probabilities: list[float],
    accuracy: float
):
    """
    Saves the prediction result to the database synchronously in a background thread,
    so it doesn't block the HTTP response.
    """
    db = SessionLocal()
    try:
        record = DiseaseLog(
            file_name=filename,
            image_reference=file_path,
            disease_name=prediction,
            class_index=class_index,
            prob_bercak_daun=probabilities[0] if len(probabilities) > 0 else 0.0,
            prob_busuk_daun=probabilities[1] if len(probabilities) > 1 else 0.0,
            prob_sehat=probabilities[2] if len(probabilities) > 2 else 0.0,
            confidence_score=accuracy
        )
        db.add(record)
        db.commit()
    except Exception as exc:
        logger.error("Failed to save prediction to DB: %s", exc)
    finally:
        db.close()


def background_save_insight_log(
    user_query: str,
    system_response: str,
    input_tokens: int,
    output_tokens: int,
    tools_called: list | None,
):
    """
    Saves the insight interaction log to the database synchronously
    in a background thread, so it doesn't block the HTTP response.
    """
    db = SessionLocal()
    try:
        record = InsightLog(
            user_query=user_query,
            system_response=system_response,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tools_called=tools_called,
        )
        db.add(record)
        db.commit()
        logger.info("Insight log saved (tokens: %d in / %d out, tools: %d)",
                    input_tokens, output_tokens, len(tools_called or []))
    except Exception as exc:
        logger.error("Failed to save insight log to DB: %s", exc)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    """Health check endpoint for Docker and monitoring."""
    ml: MLService = app.state.ml_service
    return {
        "status": "ok",
        "service": "intelligent-service",
        "models": {
            "disease": ml.disease_classifier.is_loaded,
        },
    }


@app.get("/predictions")
def get_predictions(db: Session = Depends(get_db)):
    """Fetch all past predictions from the database."""
    records = db.query(DiseaseLog).order_by(DiseaseLog.timestamp.desc()).all()

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "filename": r.file_name,
            "imgUrl": r.image_reference,
            "prediction": r.disease_name,
            "probability": [
                r.prob_bercak_daun,
                r.prob_busuk_daun,
                r.prob_sehat
            ],
            "class_index": r.class_index,
            "accuracy": r.confidence_score,
            "date": r.timestamp
        })
    return result


@app.post("/predict")
async def predict(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Disease classification endpoint.

    Accepts an image upload, runs it through the TFLite disease
    classifier, and returns the prediction instantly while saving
    to the database in the background.
    """
    ml: MLService = app.state.ml_service

    image_bytes = await file.read()

    # Run disease inference pipeline (blocking, but fast)
    result = ml.predict_disease(image_bytes)

    response_filename = file.filename
    response_filepath = ""

    # Save to disk and enqueue background task only if successful
    if result.status == "ok":
        # Generate random filename preserving extension
        ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        random_filename = f"{uuid.uuid4().hex}{ext}"
        
        # Absolute path for saving on disk
        absolute_file_path = os.path.join(UPLOAD_DIR, random_filename)
        # Relative path for DB and API response consistency
        relative_file_path = f"uploads/{random_filename}"
        
        with open(absolute_file_path, "wb") as buffer:
            buffer.write(image_bytes)

        background_tasks.add_task(
            background_save_prediction,
            filename=random_filename,
            file_path=relative_file_path,
            prediction=result.label,
            class_index=result.class_index,
            probabilities=result.probabilities,
            accuracy=result.confidence
        )
        
        response_filename = random_filename
        response_filepath = relative_file_path

    # Note: We omit 'id' from the response as it is generated asynchronously by DB
    return {
        "filename": response_filename,
        "imgUrl": response_filepath,
        "prediction": result.label,
        "probability": result.probabilities,
        "class_index": result.class_index,
        "accuracy": result.confidence,
        "status": result.status,
        "error": result.error,
    }


# ---------------------------------------------------------------------------
# Insight endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/insights", response_model=InsightResponse)
async def insights(body: InsightRequest, background_tasks: BackgroundTasks):
    """
    Generate a natural language insight about the greenhouse.

    Queries the knowledge-service MCP tools via OpenAI to produce
    a personalised, data-driven recommendation.
    The interaction (query, response, tokens, tools) is logged
    asynchronously in the background.
    """
    orchestrator: InsightOrchestrator = app.state.insight_orchestrator

    try:
        result: InsightResult = await orchestrator.generate(body.query)

        background_tasks.add_task(
            background_save_insight_log,
            user_query=body.query,
            system_response=result.answer,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            tools_called=result.tools_called if result.tools_called else None,
        )

        return InsightResponse(answer=result.answer, status="ok")
    except Exception:
        logger.exception("Insight generation failed")
        return InsightResponse(
            answer="An error occurred while generating your insight. Please try again.",
            status="error",
        )
