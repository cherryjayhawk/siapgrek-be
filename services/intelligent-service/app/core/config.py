"""
Configuration module.

Loads environment variables and exposes them as typed constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# --- MQTT ---
MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_USERNAME: str = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD: str = os.getenv("MQTT_PASSWORD", "")

# --- PostgreSQL ---
POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_USER: str = os.getenv("POSTGRES_USER", "")
POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
POSTGRES_DB: str = os.getenv("POSTGRES_DB", "")
# DATABASE_URL: str = os.getenv("DATABASE_URL", f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_pcrse93vmkCY@ep-mute-wildflower-a1s7gj8h-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

# --- TFLite Model Paths ---
DISEASE_MODEL_PATH: str = os.getenv("DISEASE_MODEL_PATH", "models/model_cnn_finetuned_V3.tflite")

# --- Service ---
SERVICE_PORT: int = int(os.getenv("SERVICE_PORT", "3003"))

# --- Knowledge Service MCP ---
KNOWLEDGE_MCP_URL: str = os.getenv("KNOWLEDGE_MCP_URL", "http://localhost:3002/mcp")

# --- OpenAI ---
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "200"))
