"""
intelligent-service — FastAPI Application Entry Point.

Manages the application lifecycle:
  - Initializes database schema
  - Loads TFLite disease classification model
  - Starts Insight Orchestrator (OpenAI + MCP)
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

from app.services.ml_service import MLService
from app.mcp_client import MCPClient
from app.insights import InsightOrchestrator, InsightResult
from app.chat import ChatbotOrchestrator, ChatResult
from app.schemas import InsightRequest, InsightResponse, ChatRequest, ChatResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cloudinary
# ---------------------------------------------------------------------------
import cloudinary
import cloudinary.uploader
import cloudinary.api


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

    # 4. MCP client (connects to knowledge-service)
    mcp_client = MCPClient()
    await mcp_client.connect()

    # 5. Insight orchestrator
    insight_orchestrator = InsightOrchestrator(mcp_client)
    chatbot_orchestrator = ChatbotOrchestrator(mcp_client)

    # Store refs on app.state so routes can access them
    app.state.ml_service = ml_service
    app.state.mcp_client = mcp_client
    app.state.insight_orchestrator = insight_orchestrator
    app.state.chatbot_orchestrator = chatbot_orchestrator

    yield

    # --- Shutdown ----------------------------------------------------------
    logger.info("=== intelligent-service shutting down ===")
    await mcp_client.disconnect()


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="intelligent-service",
    description="Core AI Intelligence layer — ML inference (Disease Classification) and Insight Orchestrator",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call this service
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("TRUSTED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.knowledge import router as knowledge_router
app.include_router(knowledge_router)




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
    tool_results: list | None = None,
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
            tool_results=tool_results,
        )
        db.add(record)
        db.commit()
        logger.info("Insight log saved (tokens: %d in / %d out, tools: %d)",
                    input_tokens, output_tokens, len(tools_called or []))
    except Exception as exc:
        logger.error("Failed to save insight log to DB: %s", exc)
    finally:
        db.close()


def background_save_chat(
    session_id: str,
    user_msg: dict,
    assistant_response: str,
    tool_results: list | None = None,
):
    """
    Saves the new chat messages to chat_message table.
    """
    from app.db.models import ChatMessage
    db = SessionLocal()
    try:
        db.add(ChatMessage(
            session_id=session_id,
            role=user_msg["role"],
            content=user_msg["content"]
        ))
        
        db.add(ChatMessage(
            session_id=session_id,
            role="assistant",
            content=assistant_response,
            tool_results=tool_results
        ))
        
        db.commit()
        logger.info("Chat messages appended to DB (Session: %s)", session_id)
    except Exception as exc:
        logger.error("Failed to save chat to DB: %s", exc)
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

    # Upload to Cloudinary and enqueue background task only if successful
    if result.status == "ok":
        try:
            upload_result = cloudinary.uploader.upload(image_bytes)
            secure_url = upload_result.get("secure_url")
            
            background_tasks.add_task(
                background_save_prediction,
                filename=file.filename,
                file_path=secure_url,
                prediction=result.label,
                class_index=result.class_index,
                probabilities=result.probabilities,
                accuracy=result.confidence
            )
            
            response_filepath = secure_url
        except Exception as e:
            logger.error("Failed to upload image to Cloudinary: %s", e)
            return {
                "filename": file.filename,
                "imgUrl": "",
                "prediction": "",
                "probability": [],
                "class_index": -1,
                "accuracy": 0.0,
                "status": "error",
                "error": "Image upload failed. Please try again."
            }

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
        result: InsightResult = await orchestrator.generate(body.query, body.lat, body.lon)

        background_tasks.add_task(
            background_save_insight_log,
            user_query=body.query,
            system_response=result.answer,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            tools_called=result.tools_called if result.tools_called else None,
            tool_results=result.tool_results if result.tool_results else None,
        )

        return InsightResponse(answer=result.answer, status="ok")
    except Exception:
        logger.exception("Insight generation failed")
        return InsightResponse(
            answer="An error occurred while generating your insight. Please try again.",
            status="error",
        )

# ---------------------------------------------------------------------------
# Chat endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Handle a multi-turn chat interaction.
    """
    orchestrator: ChatbotOrchestrator = app.state.chatbot_orchestrator

    try:
        from app.db.models import ChatSession
        
        session_id = body.session_id
        if not session_id:
            last_user_query = body.messages[-1].content
            title = last_user_query[:50] + "..." if len(last_user_query) > 50 else last_user_query
            new_session = ChatSession(title=title)
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            session_id = new_session.id
            
        # Convert Pydantic payloads to simple dicts
        history = [{"role": msg.role, "content": msg.content} for msg in body.messages]
        result: ChatResult = await orchestrator.generate(history)

        background_tasks.add_task(
            background_save_chat,
            session_id=session_id,
            user_msg=history[-1],
            assistant_response=result.answer,
            tool_results=result.tool_results if result.tool_results else None
        )

        return ChatResponse(answer=result.answer, status="ok", session_id=session_id)
    except Exception:
        logger.exception("Chat generation failed")
        return ChatResponse(
            answer="An error occurred while generating your chat response. Please try again.",
            status="error",
        )

@app.get("/api/v1/chat-sessions")
def get_chat_sessions(db: Session = Depends(get_db)):
    from app.db.models import ChatSession
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "updated_at": s.updated_at
        } for s in sessions
    ]

@app.get("/api/v1/chat-sessions/{session_id}")
def get_chat_session(session_id: str, db: Session = Depends(get_db)):
    from app.db.models import ChatSession, ChatMessage
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return {"error": "not found"}
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    return {
        "id": session.id,
        "title": session.title,
        "messages": [
            {
                "role": m.role,
                "content": m.content
            } for m in messages
        ]
    }

@app.delete("/api/v1/chat-sessions/{session_id}")
def delete_chat_session(session_id: str, db: Session = Depends(get_db)):
    from app.db.models import ChatSession
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
    return {"status": "ok"}
