"""
Preprocessing utilities for Cloudburst LSTM model

✔ Locked feature order (NO breaking changes)
✔ Safe for real-time IoT sensors & APIs
✔ Used for training, inference, retraining
✔ LSTM-compatible (sliding window ready)
✔ Production-grade validation
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional

# FEATURE DEFINITIONS (LOCKED — DO NOT CHANGE)
RAW_FEATURES = [
    "temp_min",
    "temp_max",
    "rain",
    "wind_gust",
    "wind_speed",
    "humidity",
    "pressure",
    "clouds"
]

ENGINEERED_FEATURES = [
    "temp_range",
    "rain_wind_ratio",
    "pressure_change"
]

FINAL_FEATURE_ORDER = [
    "temp_min",          # 0
    "temp_max",          # 1
    "temp_range",        # 2
    "rain",              # 3
    "rain_wind_ratio",   # 4
    "wind_gust",         # 5
    "wind_speed",        # 6
    "humidity",          # 7
    "pressure",          # 8
    "pressure_change",   # 9
    "clouds"             # 10
]

EXPECTED_FEATURE_COUNT = len(FINAL_FEATURE_ORDER)

# SENSOR VALUE SAFETY LIMITS (PHYSICAL REALITY)
SENSOR_LIMITS = {
    "temp_min": (-30, 55),       # °C
    "temp_max": (-30, 60),       # °C
    "rain": (0, 350),            # mm/hr
    "wind_gust": (0, 90),        # m/s
    "wind_speed": (0, 70),       # m/s
    "humidity": (0, 100),        # %
    "pressure": (850, 1050),     # hPa
    "clouds": (0, 100)           # %
}

# INTERNAL HELPERS
def _clip(value: float, min_v: float, max_v: float) -> float:
    """Clip sensor values to safe physical limits"""
    try:
        return float(np.clip(value, min_v, max_v))
    except Exception:
        return float(np.clip(0.0, min_v, max_v))


def _safe_divide(numerator: float, denominator: float) -> float:
    """Division-safe ratio (prevents NaN / Inf)"""
    return float(numerator / (denominator + 1e-6))


# FEATURE ENGINEERING — DATAFRAME (TRAINING)
def engineer_features_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature engineering for historical CSV dataset
    Used during LSTM training & retraining
    """

    df = df.copy()

    missing = set(RAW_FEATURES) - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Engineered features
    df["temp_range"] = df["temp_max"] - df["temp_min"]
    df["rain_wind_ratio"] = df["rain"] / (df["wind_speed"] + 1e-6)
    df["pressure_change"] = df["pressure"].diff().fillna(0)

    # Safety cleanup
    df.replace([np.inf, -np.inf], 0, inplace=True)
    df.fillna(0, inplace=True)

    return df[FINAL_FEATURE_ORDER]


# FEATURE ENGINEERING — LIVE SENSOR (ARGUMENT BASED)
def engineer_features_live(
    temp_min: float,
    temp_max: float,
    rain: float,
    wind_gust: float,
    wind_speed: float,
    humidity: float,
    pressure: float,
    clouds: float,
    prev_pressure: Optional[float] = None
) -> List[float]:
    """
    Feature engineering for live IoT sensor values
    Used before sliding window update
    """

    # Clip raw values
    temp_min = _clip(temp_min, *SENSOR_LIMITS["temp_min"])
    temp_max = _clip(temp_max, *SENSOR_LIMITS["temp_max"])
    rain = _clip(rain, *SENSOR_LIMITS["rain"])
    wind_gust = _clip(wind_gust, *SENSOR_LIMITS["wind_gust"])
    wind_speed = _clip(wind_speed, *SENSOR_LIMITS["wind_speed"])
    humidity = _clip(humidity, *SENSOR_LIMITS["humidity"])
    pressure = _clip(pressure, *SENSOR_LIMITS["pressure"])
    clouds = _clip(clouds, *SENSOR_LIMITS["clouds"])

    # Engineered features
    temp_range = temp_max - temp_min
    rain_wind_ratio = _safe_divide(rain, wind_speed)

    pressure_change = (
        0.0 if prev_pressure is None else pressure - prev_pressure
    )

    features = [
        temp_min,
        temp_max,
        temp_range,
        rain,
        rain_wind_ratio,
        wind_gust,
        wind_speed,
        humidity,
        pressure,
        pressure_change,
        clouds
    ]

    validate_feature_vector(features)
    return features


# FEATURE ENGINEERING — LIVE SENSOR (DICT BASED)
def engineer_features_from_dict(
    sensor_data: Dict,
    prev_pressure: Optional[float] = None
) -> List[float]:
    """
    Feature engineering for API / WebSocket payloads
    Ideal for frontend → backend integration
    """

    return engineer_features_live(
        temp_min=sensor_data.get("temp_min", 0.0),
        temp_max=sensor_data.get("temp_max", 0.0),
        rain=sensor_data.get("rain", 0.0),
        wind_gust=sensor_data.get("wind_gust", 0.0),
        wind_speed=sensor_data.get("wind_speed", 0.0),
        humidity=sensor_data.get("humidity", 0.0),
        pressure=sensor_data.get("pressure", 1013.0),
        clouds=sensor_data.get("clouds", 0.0),
        prev_pressure=prev_pressure
    )


# LSTM INPUT SHAPING
def to_lstm_array(
    feature_window: List[List[float]]
) -> np.ndarray:
    """
    Converts sliding window to LSTM input shape
    Output shape: (1, TIMESTEPS, FEATURE_COUNT)
    """

    arr = np.array(feature_window, dtype=np.float32)

    if arr.ndim != 2 or arr.shape[1] != EXPECTED_FEATURE_COUNT:
        raise ValueError(
            f"Invalid LSTM window shape: {arr.shape}"
        )

    return np.expand_dims(arr, axis=0)


# VALIDATION
def validate_feature_vector(features: List[float]) -> bool:
    """
    Ensures feature vector matches LSTM expectation
    """

    if not isinstance(features, list):
        raise ValueError("Features must be a list")

    if len(features) != EXPECTED_FEATURE_COUNT:
        raise ValueError(
            f"Invalid feature length: expected {EXPECTED_FEATURE_COUNT}, "
            f"got {len(features)}"
        )

    if not all(isinstance(x, (int, float)) for x in features):
        raise ValueError("All features must be numeric")

    return True