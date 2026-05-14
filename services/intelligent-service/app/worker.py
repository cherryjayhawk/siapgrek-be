"""
Telemetry Worker.

Subscribes to the MQTT ``orchid/+/telemetry`` topic and
processes each incoming reading through:
  1. Fuzzy logic control evaluation (excluding soil pH and EC)
  2. MQTT actuator command publishing (misting_pump, curtain)

Actuators (per config.yaml):
  - misting_pump: 1 (ON) / 0 (OFF)
  - curtain: 1 (OPEN) / 0 (CLOSE)

Note: Disease classification is image-based and handled via the
``/predict`` HTTP endpoint — it is NOT part of the telemetry pipeline.
"""

import asyncio
import json
import logging

import paho.mqtt.client as paho_mqtt

from app.core.config import (
    MQTT_BROKER_HOST,
    MQTT_BROKER_PORT,
    MQTT_PASSWORD,
    MQTT_USERNAME,
)
from app.schemas import TelemetryReading
from app.services.fuzzy_service import FuzzyController

logger = logging.getLogger(__name__)

TELEMETRY_TOPIC = "orchid/+/telemetry"


class TelemetryWorker:
    """
    Async background worker that listens for telemetry events
    on MQTT and orchestrates the fuzzy control pipeline.
    """

    def __init__(
        self,
        fuzzy_controller: FuzzyController,
    ) -> None:
        self._fuzzy = fuzzy_controller
        self._running = False
        self._task: asyncio.Task | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

        # MQTT client setup
        self._client = paho_mqtt.Client(
            paho_mqtt.CallbackAPIVersion.VERSION2,
            client_id="intelligent-service-worker",
        )
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message

        if MQTT_USERNAME:
            self._client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Start the MQTT subscription loop."""
        self._running = True
        self._loop = asyncio.get_event_loop()
        try:
            self._client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60)
            self._client.loop_start()
            logger.info(
                "TelemetryWorker started — connecting to MQTT %s:%s",
                MQTT_BROKER_HOST,
                MQTT_BROKER_PORT,
            )
        except Exception as exc:
            logger.error("TelemetryWorker MQTT connection failed: %s", exc)

    async def stop(self) -> None:
        """Gracefully stop the worker."""
        self._running = False
        self._client.loop_stop()
        self._client.disconnect()
        logger.info("TelemetryWorker stopped")

    # ------------------------------------------------------------------
    # MQTT callbacks
    # ------------------------------------------------------------------

    def _on_connect(
        self,
        client: paho_mqtt.Client,
        userdata: object,
        flags: paho_mqtt.ConnectFlags,
        reason_code: paho_mqtt.ReasonCode,
        properties: paho_mqtt.Properties | None,
    ) -> None:
        if reason_code == 0:
            logger.info("TelemetryWorker MQTT connected — subscribing to %s", TELEMETRY_TOPIC)
            client.subscribe(TELEMETRY_TOPIC, qos=1)
        else:
            logger.error("TelemetryWorker MQTT connection refused: %s", reason_code)

    def _on_message(
        self,
        client: paho_mqtt.Client,
        userdata: object,
        msg: paho_mqtt.MQTTMessage,
    ) -> None:
        """Handle incoming MQTT messages — dispatches to async processing."""
        if self._loop and self._running:
            asyncio.run_coroutine_threadsafe(
                self._process_message(msg.topic, msg.payload.decode("utf-8")),
                self._loop,
            )

    # ------------------------------------------------------------------
    # Message processing
    # ------------------------------------------------------------------

    async def _process_message(self, topic: str, raw: str) -> None:
        """Parse, run fuzzy control, and publish commands."""
        # Extract device_id from topic: orchid/{device_id}/telemetry
        parts = topic.split("/")
        if len(parts) < 3:
            logger.warning("Unexpected topic format: %s", topic)
            return

        try:
            payload = json.loads(raw)

            # Map the nested MQTT payload to our flat schema
            data = {
                "deviceId": parts[1],
                "timestamp": payload.get("timestamp"),
                "soilTemperature": payload.get("soil", {}).get("temperature"),
                "soilHumidity": payload.get("soil", {}).get("humidity"),
                "envTemperature": payload.get("environment", {}).get("temperature"),
                "envHumidity": payload.get("environment", {}).get("humidity"),
                "lightLux": payload.get("light", {}).get("lux"),
                "soilPh": payload.get("soil", {}).get("ph"),
                "soilConductivity": payload.get("soil", {}).get("ec"),
            }

            reading = TelemetryReading.model_validate(data)
        except Exception as exc:
            logger.error("Failed to parse telemetry payload: %s — %s", exc, raw[:200])
            return

        device_id = reading.device_id

        try:
            # --- Fuzzy Control (excluding pH and EC) --------------------------
            control = self._fuzzy.evaluate(
                soil_temperature=reading.soil_temperature,
                soil_humidity=reading.soil_humidity,
                env_temperature=reading.env_temperature,
                env_humidity=reading.env_humidity,
                lux=reading.light_lux,
            )

            # --- Publish commands to MQTT ------------------------------------
            if control.needs_override:
                # Publish misting_pump command: 1 (ON) / 0 (OFF)
                mist_value = 1 if control.misting_pump else 0
                mist_topic = f"orchid/{device_id}/command/misting_pump"
                self._client.publish(mist_topic, str(mist_value), qos=1)

                logger.info(
                    "[%s] Command published: misting_pump=%d",
                    device_id,
                    mist_value,
                )

                # Publish curtain command: 1 (OPEN) / 0 (CLOSE) — future use
                if control.curtain:
                    curtain_topic = f"orchid/{device_id}/command/curtain"
                    self._client.publish(curtain_topic, "1", qos=1)
                    logger.info("[%s] Command published: curtain=OPEN", device_id)

        except Exception as exc:
            logger.error(
                "[%s] Processing failed: %s",
                device_id,
                exc,
                exc_info=True,
            )
