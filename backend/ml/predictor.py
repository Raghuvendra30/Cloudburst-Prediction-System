import os
import numpy as np
import joblib
import tensorflow as tf

from backend.config import (
    LSTM_MODEL_PATH,
    SCALER_PATH,
    TIMESTEPS,
    THRESHOLD
)

# ------------------------------------------------
# Load model + scaler once (on startup)
# ------------------------------------------------
if not os.path.exists(LSTM_MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {LSTM_MODEL_PATH}")

if not os.path.exists(SCALER_PATH):
    raise FileNotFoundError(f"Scaler not found: {SCALER_PATH}")

print(f"Loading LSTM model from: {LSTM_MODEL_PATH}")
model = tf.keras.models.load_model(LSTM_MODEL_PATH, compile=False)

print(f"Loading scaler from: {SCALER_PATH}")
scaler = joblib.load(SCALER_PATH)

print("Predictor loaded successfully")

# ------------------------------------------------
# Sliding window buffer (local safe version)
# ------------------------------------------------
window_buffer = []


def update_window(data):
    global window_buffer

    window_buffer.append(data)

    if len(window_buffer) > TIMESTEPS:
        window_buffer.pop(0)

    return np.array(window_buffer)


# ------------------------------------------------
# Prediction Function
# ------------------------------------------------
def predict_cloudburst(
    temp_min: float,
    temp_max: float,
    rain: float,
    wind_gust: float,
    wind_speed: float,
    humidity: float,
    pressure: float,
    clouds: float,
):
    """
    LSTM sequence-based prediction
    Must match EXACT training feature order.
    """

    # Build feature vector (ORDER MUST MATCH TRAINING)
    raw_features = [
        temp_min,
        temp_max,
        rain,
        wind_gust,
        wind_speed,
        humidity,
        pressure,
        clouds,
    ]

    # Scale
    X = np.array([raw_features], dtype=np.float32)
    X_scaled = scaler.transform(X)[0]

    # Update sliding window
    window = update_window(X_scaled)

    # Wait until window is full
    if len(window) < TIMESTEPS:
        return False, 0.0

    #Reshape for LSTM → (1, TIMESTEPS, FEATURES)
    window = np.expand_dims(window, axis=0)

    # Predict
    prob = float(model.predict(window, verbose=0)[0][0])
    cloudburst = prob >= THRESHOLD

    return cloudburst, round(prob, 4)