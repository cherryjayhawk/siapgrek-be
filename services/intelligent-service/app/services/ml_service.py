"""
ML Inference Service.

Single inference pipeline:

1. **Disease Classification** (image-based):
   TFLite CNN feature extractor → Random Forest classifier.
   Input: 224×224 RGB image.
   Labels: BERCAK DAUN, BUSUK DAUN, SEHAT.
"""

import io
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


# ======================================================================
# Result types
# ======================================================================

@dataclass
class DiseasePredictionResult:
    """Result from the disease classification pipeline."""

    label: str
    class_index: int
    confidence: float
    probabilities: list[float] = field(default_factory=list)
    status: str = "ok"
    error: str | None = None


# ======================================================================
# Label maps
# ======================================================================

DISEASE_LABELS = ["BERCAK DAUN", "BUSUK DAUN", "SEHAT"]


# ======================================================================
# Disease Classification (Image → CNN features → Random Forest)
# ======================================================================

class DiseaseClassifier:
    """
    Disease classification pipeline.

    Input: 224x224 RGB image.
    Model: TFLite model (model_cnn_finetuned_V3.tflite)
    """

    IMAGE_SIZE = (224, 224)

    def __init__(self, tflite_path: str) -> None:
        self._tflite_path = tflite_path
        self._interpreter: Any | None = None
        self._input_details: list[dict] | None = None
        self._output_details: list[dict] | None = None
        self._loaded = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def load(self) -> bool:
        """Load the TFLite feature extractor and the Random Forest model."""
        try:
            # --- TFLite CNN ---
            tflite_file = Path(self._tflite_path)
            if not tflite_file.exists():
                logger.error("TFLite model not found: %s", self._tflite_path)
                return False

            import ai_edge_litert.interpreter as tflite  # type: ignore[import-untyped]

            self._interpreter = tflite.Interpreter(model_path=str(tflite_file))
            self._interpreter.allocate_tensors()
            self._input_details = self._interpreter.get_input_details()
            self._output_details = self._interpreter.get_output_details()
            logger.info("TFLite model loaded: %s", self._tflite_path)

            self._loaded = True
            return True

        except Exception as exc:
            logger.error("Failed to load disease models: %s", exc)
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    # ------------------------------------------------------------------
    # Image preprocessing
    # ------------------------------------------------------------------

    @staticmethod
    def preprocess_image(image_bytes: bytes) -> np.ndarray:
        """
        Convert raw image bytes to a (1, 224, 224, 3) float32 array
        normalised to [0, 1].
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(DiseaseClassifier.IMAGE_SIZE)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0) / 255.0
        return img_array

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, image_bytes: bytes) -> DiseasePredictionResult:
        """
        Run the full disease pipeline on raw image bytes.

        Returns a safe fallback if models aren't loaded or inference fails.
        """
        if not self._loaded:
            return DiseasePredictionResult(
                label=DISEASE_LABELS[-1],  # default to SEHAT
                class_index=len(DISEASE_LABELS) - 1,
                confidence=0.0,
                probabilities=[0.0] * len(DISEASE_LABELS),
                status="fallback",
                error="Disease models not loaded",
            )

        try:
            # 1. Preprocess
            img_array = self.preprocess_image(image_bytes)

            # 2. CNN inference via TFLite
            self._interpreter.set_tensor(
                self._input_details[0]["index"],  # type: ignore[index]
                img_array.astype(np.float32),
            )
            self._interpreter.invoke()
            probabilities = self._interpreter.get_tensor(
                self._output_details[0]["index"]  # type: ignore[index]
            )[0]

            prediction = int(np.argmax(probabilities))
            predicted_label = DISEASE_LABELS[prediction]
            confidence = float(np.max(probabilities))

            return DiseasePredictionResult(
                label=predicted_label,
                class_index=int(prediction),
                confidence=confidence,
                probabilities=[float(p) for p in probabilities],
                status="ok",
            )

        except Exception as exc:
            logger.error("Disease inference error: %s", exc)
            return DiseasePredictionResult(
                label=DISEASE_LABELS[-1],
                class_index=len(DISEASE_LABELS) - 1,
                confidence=0.0,
                probabilities=[0.0] * len(DISEASE_LABELS),
                status="fallback",
                error=str(exc),
            )


# ======================================================================
# Unified ML Service
# ======================================================================

class MLService:
    """
    High-level service wrapping the disease classification pipeline.
    """

    def __init__(
        self,
        disease_tflite_path: str,
    ) -> None:
        self.disease_classifier = DiseaseClassifier(disease_tflite_path)

    def load_models(self) -> None:
        """Load all models — safe to call during startup."""
        self.disease_classifier.load()

    def predict_disease(self, image_bytes: bytes) -> DiseasePredictionResult:
        """Classify a plant image for disease."""
        return self.disease_classifier.predict(image_bytes)
