"""
SQLAlchemy models for intelligent-service.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class DiseaseLog(Base):
    """
    Stores past prediction results for the disease classification pipeline.
    This schema mirrors the Prisma 'disease_log' model in the global database.
    """
    __tablename__ = "disease_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    device_id = Column(String, default="node01", nullable=True)
    
    file_name = Column(String, nullable=False)
    image_reference = Column(String, nullable=False)
    
    disease_name = Column(String, nullable=False)
    class_index = Column(Integer, nullable=False)
    confidence_score = Column(Float, nullable=False)
    
    prob_bercak_daun = Column(Float, nullable=False)
    prob_busuk_daun = Column(Float, nullable=False)
    prob_sehat = Column(Float, nullable=False)


class InsightLog(Base):
    """
    Stores execution details for each natural language insight interaction.
    Mirrors the Prisma 'insight_log' model in the global database.
    """
    __tablename__ = "insight_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_query = Column(String, nullable=False)
    system_response = Column(String, nullable=False)
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    tools_called = Column(JSON, nullable=True)
    tool_results = Column(JSON, nullable=True)

class ChatSession(Base):
    __tablename__ = "chat_session"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_message"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_session.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    tool_results = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("ChatSession", back_populates="messages")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_document"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    createdAt = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")

from pgvector.sqlalchemy import Vector

class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunk"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    documentId = Column("documentId", String, ForeignKey("knowledge_document.id", ondelete="CASCADE"), nullable=False)
    chunkIndex = Column("chunkIndex", Integer, nullable=False)
    content = Column(String, nullable=False)
    embedding = Column(Vector(1536), nullable=True)

    document = relationship("KnowledgeDocument", back_populates="chunks")
