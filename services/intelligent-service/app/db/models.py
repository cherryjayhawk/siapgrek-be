"""
SQLAlchemy models for intelligent-service.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON

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
