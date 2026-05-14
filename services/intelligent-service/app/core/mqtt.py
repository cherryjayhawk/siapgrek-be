"""
MQTT Publisher.

Connects to the Mosquitto broker and publishes actuator
command overrides to edge devices.
"""

import json
import logging
import threading

import paho.mqtt.client as paho_mqtt

from app.core.config import (
    MQTT_BROKER_HOST,
    MQTT_BROKER_PORT,
    MQTT_PASSWORD,
    MQTT_USERNAME,
)

logger = logging.getLogger(__name__)


class MQTTPublisher:
    """
    Threaded MQTT client for publishing control overrides.

    Handles broker disconnections gracefully — logs errors
    without crashing the calling worker, allowing the Edge
    node to revert to local closed-loop logic on timeout.
    """

    ACTUATOR_TOPIC_PREFIX = "actuators"

    def __init__(self) -> None:
        self._client = paho_mqtt.Client(
            paho_mqtt.CallbackAPIVersion.VERSION2,
            client_id="intelligent-service",
        )
        self._connected = False
        self._lock = threading.Lock()

        # Attach callbacks
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect

        # Auth
        if MQTT_USERNAME:
            self._client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def connect(self) -> None:
        """Connect to the broker and start the background network loop."""
        try:
            self._client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60)
            self._client.loop_start()
            logger.info(
                "MQTT connecting to %s:%s ...", MQTT_BROKER_HOST, MQTT_BROKER_PORT
            )
        except Exception as exc:
            logger.error("MQTT initial connection failed: %s", exc)

    def disconnect(self) -> None:
        """Stop the network loop and disconnect cleanly."""
        self._client.loop_stop()
        self._client.disconnect()
        self._connected = False
        logger.info("MQTT disconnected")

    # ------------------------------------------------------------------
    # Publishing
    # ------------------------------------------------------------------

    def publish_override(self, device_id: str, payload: dict) -> bool:
        """
        Publish a JSON control payload to ``actuators/<device_id>/command``.

        Returns True on success, False if disconnected or publish failed.
        """
        topic = f"{self.ACTUATOR_TOPIC_PREFIX}/{device_id}/command"

        with self._lock:
            if not self._connected:
                logger.warning(
                    "MQTT not connected — cannot publish override to %s", topic
                )
                return False

        try:
            message = json.dumps(payload)
            info = self._client.publish(topic, message, qos=1)
            if info.rc == paho_mqtt.MQTT_ERR_SUCCESS:
                logger.debug("Published to %s: %s", topic, message)
                return True
            else:
                logger.error("MQTT publish returned rc=%d for %s", info.rc, topic)
                return False
        except Exception as exc:
            logger.error("MQTT publish error for %s: %s", topic, exc)
            return False

    # ------------------------------------------------------------------
    # Callbacks
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
            self._connected = True
            logger.info("MQTT connected to broker")
        else:
            self._connected = False
            logger.error("MQTT connection refused: %s", reason_code)

    def _on_disconnect(
        self,
        client: paho_mqtt.Client,
        userdata: object,
        flags: paho_mqtt.DisconnectFlags,
        reason_code: paho_mqtt.ReasonCode,
        properties: paho_mqtt.Properties | None,
    ) -> None:
        self._connected = False
        logger.warning("MQTT disconnected (rc=%s) — edge will revert to local control", reason_code)
