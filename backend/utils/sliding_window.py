"""
Advanced Sliding Window Utility for LSTM Time-Series Input

Features:
- Thread-safe
- Cold-start safe
- Auto sync with config
- Optional dynamic feature engineering
- Model-safe shape output
"""

from typing import List
import threading
import numpy as np

from backend.config import TIMESTEPS, FEATURE_COUNT

WINDOW_SIZE = TIMESTEPS
NUM_FEATURES = FEATURE_COUNT

_buffer: List[List[float]] = []
_lock = threading.Lock()

# ---------------------------------------------------
# OPTIONAL: enable dynamic pressure change feature
# ---------------------------------------------------
ENABLE_PRESSURE_CHANGE = False   # ⚠ Set True only if model trained with it
PRESSURE_INDEX = 6               # Adjust if needed


# ---------------------------------------------------
# RESET WINDOW
# ---------------------------------------------------
def reset_window():
    global _buffer
    with _lock:
        _buffer = []


# ---------------------------------------------------
# UPDATE WINDOW
# ---------------------------------------------------
def update_window(features: List[float]) -> np.ndarray:
    global _buffer

    if not isinstance(features, list):
        raise TypeError("Features must be provided as list")

    if len(features) != NUM_FEATURES:
        raise ValueError(
            f"Expected {NUM_FEATURES} features, got {len(features)}"
        )

    features = features.copy()

    with _lock:

        # ---------------- OPTIONAL PRESSURE CHANGE ----------------
        if ENABLE_PRESSURE_CHANGE:
            if not _buffer:
                pressure_change = 0.0
            else:
                prev_pressure = _buffer[-1][PRESSURE_INDEX]
                curr_pressure = features[PRESSURE_INDEX]
                pressure_change = curr_pressure - prev_pressure

            features.append(pressure_change)

        # ---------------- UPDATE BUFFER ----------------
        _buffer.append(features)

        if len(_buffer) > WINDOW_SIZE:
            _buffer.pop(0)

        # ---------------- WARMUP PADDING ----------------
        if len(_buffer) < WINDOW_SIZE:
            pad_count = WINDOW_SIZE - len(_buffer)
            padded = [_buffer[0]] * pad_count + _buffer
        else:
            padded = _buffer

        window_array = np.array(padded, dtype=np.float32)

        # Shape → (1, TIMESTEPS, FEATURES)
        return np.expand_dims(window_array, axis=0)


# ---------------------------------------------------
# STATUS CHECKS
# ---------------------------------------------------
def is_window_ready() -> bool:
    with _lock:
        return len(_buffer) >= WINDOW_SIZE


def get_current_window_size() -> int:
    with _lock:
        return len(_buffer)