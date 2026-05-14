# ============================================
# intelligent-service Dockerfile
# Python 3.12 + FastAPI + uv
# ============================================

FROM python:3.12-slim AS base

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies (frozen to match lockfile exactly)
RUN uv sync --frozen --no-dev

# Copy application code and model assets
COPY app/ ./app/
COPY models/ ./models/

# Expose service port
EXPOSE 3003

# Run the FastAPI server via uvicorn
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3003"]
