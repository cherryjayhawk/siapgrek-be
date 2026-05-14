"""
Redis connection manager.

Provides an async Redis client for Pub/Sub consumption
of telemetry events emitted by the ingestion-service.
"""

import logging

import redis.asyncio as aioredis

from app.core.config import REDIS_HOST, REDIS_PORT

logger = logging.getLogger(__name__)


def create_redis_client() -> aioredis.Redis:
    """Create and return an async Redis client instance."""
    client = aioredis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True,
    )
    logger.info("Redis client created -> %s:%s", REDIS_HOST, REDIS_PORT)
    return client
