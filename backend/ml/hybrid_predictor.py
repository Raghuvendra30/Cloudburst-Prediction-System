import os
import numpy as np
import joblib
import tensorflow as tf

from typing import Tuple, Dict

from backend.config import (
    LSTM_MODEL_PATH,
    XGB_MODEL_PATH,
    SCALER_PATH,
    TIMESTEPS,
    THRESHOLD,
    LOW_RISK_THRESHOLD,
    MODERATE_RISK_THRESHOLD,
    HIGH_RISK_THRESHOLD,
)

# =========================================================
# VALIDATE PATHS
# =========================================================

if not os.path.exists(LSTM_MODEL_PATH):
    raise FileNotFoundError(
        f"LSTM model not found: {LSTM_MODEL_PATH}"
    )

if not os.path.exists(XGB_MODEL_PATH):
    raise FileNotFoundError(
        f"XGBoost model not found: {XGB_MODEL_PATH}"
    )

if not os.path.exists(SCALER_PATH):
    raise FileNotFoundError(
        f"Scaler not found: {SCALER_PATH}"
    )

# =========================================================
# LOAD MODELS
# =========================================================

print("=" * 60)
print("Loading Hybrid Prediction System...")
print("=" * 60)

# ---------------------------------------------------------
# LOAD LSTM MODEL
# ---------------------------------------------------------

try:

    print(f"Loading LSTM model from: {LSTM_MODEL_PATH}")

    lstm_model = tf.keras.models.load_model(
        LSTM_MODEL_PATH,
        compile=False
    )

    print("✅ LSTM model loaded successfully")

except Exception as e:

    print("❌ Failed to load LSTM model")
    print(str(e))
    raise e

# ---------------------------------------------------------
# LOAD XGBOOST MODEL
# ---------------------------------------------------------

try:

    print(f"Loading XGBoost model from: {XGB_MODEL_PATH}")

    xgb_model = joblib.load(XGB_MODEL_PATH)

    print("✅ XGBoost model loaded successfully")

except Exception as e:

    print("❌ Failed to load XGBoost model")
    print(str(e))
    raise e

# ---------------------------------------------------------
# LOAD SCALER
# ---------------------------------------------------------

try:

    print(f"Loading scaler from: {SCALER_PATH}")

    scaler = joblib.load(SCALER_PATH)

    print("✅ Scaler loaded successfully")

except Exception as e:

    print("❌ Failed to load scaler")
    print(str(e))
    raise e

print("=" * 60)
print("✅ Hybrid Predictor Ready")
print("=" * 60)

# =========================================================
# SLIDING WINDOW BUFFER
# =========================================================

window_buffer = []


def update_window(data: np.ndarray) -> np.ndarray:
    """
    Maintain sliding sequence window for LSTM
    """

    global window_buffer

    window_buffer.append(data)

    # Keep latest TIMESTEPS
    if len(window_buffer) > TIMESTEPS:
        window_buffer.pop(0)

    return np.array(window_buffer, dtype=np.float32)


# =========================================================
# RISK LEVEL
# =========================================================

def get_risk_level(prob: float) -> str:

    if prob >= HIGH_RISK_THRESHOLD:
        return "HIGH"

    elif prob >= MODERATE_RISK_THRESHOLD:
        return "MODERATE"

    return "LOW"


# =========================================================
# CONFIDENCE
# =========================================================

def get_confidence(prob: float) -> str:

    if prob >= 0.85:
        return "HIGH_CONFIDENCE"

    elif prob >= 0.65:
        return "MEDIUM_CONFIDENCE"

    return "LOW_CONFIDENCE"


# =========================================================
# HYBRID PREDICTION
# =========================================================

def hybrid_predict(
    temp_min: float,
    temp_max: float,
    rain: float,
    wind_gust: float,
    wind_speed: float,
    humidity: float,
    pressure: float,
    clouds: float,
) -> Tuple[bool, float, Dict]:

    try:

        # -------------------------------------------------
        # FEATURE ORDER MUST MATCH TRAINING
        # -------------------------------------------------

        # =========================================================
        # FEATURE ENGINEERING
        # MUST MATCH TRAINING FEATURES EXACTLY
        # =========================================================

        temp = (temp_min + temp_max) / 2

        temp_pressure = temp / (pressure + 0.0001)

        humidity_temp = humidity * temp

        wind_rain = wind_speed * rain

        # Since live data has no previous values,
        # use safe defaults for realtime prediction

        pressure_change = 0

        rain_rate = rain

        humidity_pressure = humidity / (pressure + 0.0001)

        # =========================================================
        # FINAL FEATURE VECTOR (11 FEATURES)
        # EXACT SAME ORDER AS TRAINING
        # =========================================================

        raw_features = [

            temp,
            humidity,
            pressure,
            wind_speed,
            rain,

            temp_pressure,
            humidity_temp,
            wind_rain,
            pressure_change,
            rain_rate,
            humidity_pressure
        ]

        X = np.array([raw_features], dtype=np.float32)

        # -------------------------------------------------
        # SCALE FEATURES
        # -------------------------------------------------

        X_scaled = scaler.transform(X)[0]

        # -------------------------------------------------
        # XGBOOST PREDICTION
        # -------------------------------------------------

        xgb_prob = float(
            xgb_model.predict_proba([X_scaled])[0][1]
        )

        # -------------------------------------------------
        # UPDATE LSTM WINDOW
        # -------------------------------------------------

        window = update_window(X_scaled)

        # -------------------------------------------------
        # WARMUP PHASE
        # -------------------------------------------------

        if len(window) < TIMESTEPS:

            final_prob = xgb_prob

            cloudburst = final_prob >= THRESHOLD

            return cloudburst, round(final_prob, 4), {

                "model_used": "XGBoost (Warmup)",

                "xgb_prob": round(xgb_prob, 4),

                "lstm_prob": None,

                "risk_level": get_risk_level(final_prob),

                "confidence": get_confidence(final_prob),

                "sequence_length": len(window),
            }

        # -------------------------------------------------
        # LSTM INPUT SHAPE
        # (1, TIMESTEPS, FEATURES)
        # -------------------------------------------------

        lstm_input = np.expand_dims(window, axis=0)

        # -------------------------------------------------
        # LSTM PREDICTION
        # -------------------------------------------------

        lstm_prob = float(
            lstm_model.predict(
                lstm_input,
                verbose=0
            )[0][0]
        )

        # -------------------------------------------------
        # HYBRID ENSEMBLE
        # -------------------------------------------------

        XGB_WEIGHT = 0.6
        LSTM_WEIGHT = 0.4

        final_prob = (
            (XGB_WEIGHT * xgb_prob)
            + (LSTM_WEIGHT * lstm_prob)
        )

        cloudburst = final_prob >= THRESHOLD

        return cloudburst, round(final_prob, 4), {

            "model_used": "Hybrid",

            "xgb_prob": round(xgb_prob, 4),

            "lstm_prob": round(lstm_prob, 4),

            "risk_level": get_risk_level(final_prob),

            "confidence": get_confidence(final_prob),

            "sequence_length": len(window),
        }

    except Exception as e:

        print("❌ Prediction Error")
        print(str(e))

        return False, 0.0, {
            "error": str(e)
        }


# =========================================================
# SENSOR DATA WRAPPER
# =========================================================

def predict_from_sensor(sensor_data: Dict) -> Dict:
    """
    Firebase Sensor Data → Prediction
    """

    try:

        # -------------------------------------------------
        # READ SENSOR DATA
        # -------------------------------------------------

        temperature = float(
            sensor_data.get("temperature", 0)
        )

        humidity = float(
            sensor_data.get("humidity", 0)
        )

        pressure = float(
            sensor_data.get("pressure", 0)
        )

        rain = float(
            sensor_data.get("rain", 0)
        )

        wind_speed = float(
            sensor_data.get("wind_speed", 0)
        )

        # -------------------------------------------------
        # DERIVED FEATURES
        # -------------------------------------------------

        temp_min = temperature - 1

        temp_max = temperature + 1

        wind_gust = wind_speed + 2

        clouds = 80 if humidity > 70 else 40

        # -------------------------------------------------
        # RUN PREDICTION
        # -------------------------------------------------

        cloudburst, probability, details = hybrid_predict(
            temp_min=temp_min,
            temp_max=temp_max,
            rain=rain,
            wind_gust=wind_gust,
            wind_speed=wind_speed,
            humidity=humidity,
            pressure=pressure,
            clouds=clouds,
        )

        # -------------------------------------------------
        # FINAL RESPONSE
        # -------------------------------------------------

        return {

            "cloudburst": cloudburst,

            "probability": probability,

            "risk_score": probability,

            "risk_level": details.get("risk_level"),

            "confidence": details.get("confidence"),

            "model_used": details.get("model_used"),

            "xgb_probability": details.get("xgb_prob"),

            "lstm_probability": details.get("lstm_prob"),

            "mapped_input": {

                "temp_min": temp_min,

                "temp_max": temp_max,

                "rain": rain,

                "wind_gust": wind_gust,

                "wind_speed": wind_speed,

                "humidity": humidity,

                "pressure": pressure,

                "clouds": clouds,
            }
        }

    except Exception as e:

        print("❌ Sensor Prediction Error")
        print(str(e))

        return {
            "error": str(e)
        }