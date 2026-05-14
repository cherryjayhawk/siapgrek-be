"""
Fuzzy Logic Controller for greenhouse environment control.

Evaluates temperature and humidity to produce actuator override
signals (misting pump) using skfuzzy (scikit-fuzzy).

Actuators (per config.yaml):
  - misting_pump: ON (1) / OFF (0)
  - curtain: OPEN (1) / CLOSE (0) — reserved for future use
"""

import logging
from dataclasses import dataclass

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

logger = logging.getLogger(__name__)


@dataclass
class ControlAction:
    """Result of a fuzzy logic evaluation."""

    misting_pump: bool   # ON / OFF
    curtain: bool        # OPEN / CLOSE (future use)
    needs_override: bool


class FuzzyController:
    """
    Service-level fuzzy inference system.

    Membership functions:
      - Temperature: cold / optimal / hot.
      - Humidity: dry / optimal / wet.
    Output:
      - Misting level (0-100) — mapped to ON/OFF via threshold.
    """

    # Thresholds (suitable for orchid greenhouses)
    _TEMP_MIN = 15.0
    _TEMP_MAX = 40.0
    _HUM_MIN = 30.0
    _HUM_MAX = 95.0
    _MIST_MIN = 0.0
    _MIST_MAX = 100.0

    # If misting level > this, activate misting pump
    _MIST_ACTIVATE_THRESHOLD = 40.0
    # If misting level > this, we consider it a meaningful override
    _OVERRIDE_THRESHOLD = 15.0

    def __init__(self) -> None:
        self._system: ctrl.ControlSystemSimulation | None = None
        self._build_system()

    # ------------------------------------------------------------------
    # System construction
    # ------------------------------------------------------------------

    def _build_system(self) -> None:
        """Construct the fuzzy rule set."""
        try:
            # --- Antecedents (inputs) ---
            temperature = ctrl.Antecedent(
                np.arange(self._TEMP_MIN, self._TEMP_MAX + 1, 1), "temperature"
            )
            humidity = ctrl.Antecedent(
                np.arange(self._HUM_MIN, self._HUM_MAX + 1, 1), "humidity"
            )

            # --- Consequent (output) ---
            misting = ctrl.Consequent(
                np.arange(self._MIST_MIN, self._MIST_MAX + 1, 1), "misting"
            )

            # --- Membership functions: Temperature ---
            temperature["cold"] = fuzz.trimf(temperature.universe, [15, 15, 24])
            temperature["optimal"] = fuzz.trimf(temperature.universe, [22, 27, 32])
            temperature["hot"] = fuzz.trimf(temperature.universe, [30, 40, 40])

            # --- Membership functions: Humidity ---
            humidity["dry"] = fuzz.trimf(humidity.universe, [30, 30, 55])
            humidity["optimal"] = fuzz.trimf(humidity.universe, [50, 65, 80])
            humidity["wet"] = fuzz.trimf(humidity.universe, [75, 95, 95])

            # --- Membership functions: Misting level ---
            misting["off"] = fuzz.trimf(misting.universe, [0, 0, 25])
            misting["low"] = fuzz.trimf(misting.universe, [15, 35, 55])
            misting["medium"] = fuzz.trimf(misting.universe, [45, 60, 75])
            misting["high"] = fuzz.trimf(misting.universe, [65, 100, 100])

            # --- Rules ---
            rules = [
                # Hot + dry  → high misting (cool and humidify aggressively)
                ctrl.Rule(temperature["hot"] & humidity["dry"], misting["high"]),
                # Hot + optimal → medium misting (cool down)
                ctrl.Rule(temperature["hot"] & humidity["optimal"], misting["medium"]),
                # Hot + wet → low misting (already humid, light cooling only)
                ctrl.Rule(temperature["hot"] & humidity["wet"], misting["low"]),
                # Optimal temp + dry → medium misting (humidify)
                ctrl.Rule(temperature["optimal"] & humidity["dry"], misting["medium"]),
                # Optimal temp + optimal hum → off (perfect conditions)
                ctrl.Rule(temperature["optimal"] & humidity["optimal"], misting["off"]),
                # Optimal temp + wet → off (no need to add moisture)
                ctrl.Rule(temperature["optimal"] & humidity["wet"], misting["off"]),
                # Cold + dry → low misting (gentle humidification)
                ctrl.Rule(temperature["cold"] & humidity["dry"], misting["low"]),
                # Cold + optimal → off (conserve warmth)
                ctrl.Rule(temperature["cold"] & humidity["optimal"], misting["off"]),
                # Cold + wet → off (do not cool further)
                ctrl.Rule(temperature["cold"] & humidity["wet"], misting["off"]),
            ]

            system = ctrl.ControlSystem(rules)
            self._system = ctrl.ControlSystemSimulation(system)
            logger.info("Fuzzy control system initialized successfully")
        except Exception as exc:
            logger.error("Failed to build fuzzy system: %s", exc)
            self._system = None

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    def evaluate(
        self,
        soil_temperature: float,
        soil_humidity: float,
        env_temperature: float,
        env_humidity: float,
        lux: float,
    ) -> ControlAction:
        """
        Evaluate the fuzzy system with the given sensor data.

        Accepts all sensor readings EXCEPT soil pH and EC (excluded by design).
        Currently uses env_temperature and env_humidity for fuzzy inference.
        Additional inputs (soil_temperature, soil_humidity, lux) are available
        for future rule expansion.

        Returns a ``ControlAction`` with misting_pump, curtain, and
        whether an override is needed.
        """
        if self._system is None:
            logger.warning("Fuzzy system not initialized — returning no-override")
            return ControlAction(misting_pump=False, curtain=False, needs_override=False)

        try:
            # Clamp inputs to the defined universe range
            temp_clamped = float(np.clip(env_temperature, self._TEMP_MIN, self._TEMP_MAX))
            hum_clamped = float(np.clip(env_humidity, self._HUM_MIN, self._HUM_MAX))

            self._system.input["temperature"] = temp_clamped
            self._system.input["humidity"] = hum_clamped
            self._system.compute()

            mist_level = float(self._system.output["misting"])
            mist_int = int(np.clip(mist_level, 0, 100))
            misting_pump = mist_int >= self._MIST_ACTIVATE_THRESHOLD
            needs_override = mist_int >= self._OVERRIDE_THRESHOLD

            return ControlAction(
                misting_pump=misting_pump,
                curtain=False,  # Reserved for future use
                needs_override=needs_override,
            )
        except Exception as exc:
            logger.error("Fuzzy evaluation error: %s", exc)
            return ControlAction(misting_pump=False, curtain=False, needs_override=False)
