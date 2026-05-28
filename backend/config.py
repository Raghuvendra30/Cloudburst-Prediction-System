"""
GLOBAL CONFIGURATION
Cloudburst Hybrid Prediction System
Enterprise Production-Ready Configuration
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# =====================================================
# LOAD ENV VARIABLES
# =====================================================

load_dotenv()
load_dotenv("backend/.env")

ENV = os.getenv("ENV", "development").lower()
IS_PRODUCTION = ENV == "production"

# =====================================================
# BASE DIRECTORIES
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(BASE_DIR, "model")
ML_DIR = os.path.join(BASE_DIR, "ml")
IOT_DIR = os.path.join(BASE_DIR, "iot")
LOG_DIR = os.path.join(BASE_DIR, "logs")

CSV_DATA_PATH = os.path.join(ML_DIR, "cloudburst_data.csv")
METRICS_PATH = os.path.join(LOG_DIR, "model_metrics.json")

# =====================================================
# MODEL FILES (HYBRID SYSTEM)
# =====================================================

LSTM_MODEL_PATH = os.path.join(MODEL_DIR, "lstm", "lstm_model.keras")
SCALER_PATH = os.path.join(MODEL_DIR, "lstm", "scaler.pkl")

XGB_MODEL_PATH = os.path.join(MODEL_DIR, "xgboost", "xgb_model.pkl")
XGB_SCALER_PATH = os.path.join(MODEL_DIR, "artifacts", "xgb_scaler.pkl")
MODEL_VERSIONING = True
MODEL_BACKUP_DIR = os.path.join(MODEL_DIR, "versions")

# =====================================================
# HYBRID SETTINGS
# =====================================================

ENABLE_HYBRID = os.getenv("ENABLE_HYBRID", "true").lower() == "true"

LSTM_WEIGHT = float(os.getenv("LSTM_WEIGHT", 0.6))
XGB_WEIGHT = float(os.getenv("XGB_WEIGHT", 0.4))

# Normalize automatically (production safe)
TOTAL_WEIGHT = LSTM_WEIGHT + XGB_WEIGHT
if TOTAL_WEIGHT == 0:
    LSTM_WEIGHT = 0.5
    XGB_WEIGHT = 0.5
else:
    LSTM_WEIGHT = LSTM_WEIGHT / TOTAL_WEIGHT
    XGB_WEIGHT = XGB_WEIGHT / TOTAL_WEIGHT

# =====================================================
# LSTM CONFIGURATION
# =====================================================

TIMESTEPS = 10
FEATURE_COUNT = 8  # Must match training

THRESHOLD = float(os.getenv("THRESHOLD", 0.50))

BATCH_SIZE = int(os.getenv("BATCH_SIZE", 32))
EPOCHS = int(os.getenv("EPOCHS", 80))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", 0.001))
DROPOUT_RATE = float(os.getenv("DROPOUT_RATE", 0.2))

USE_GPU = os.getenv("USE_GPU", "false").lower() == "true"

# =====================================================
# CONFIDENCE SYSTEM
# =====================================================

LOW_CONFIDENCE = 0.55
HIGH_CONFIDENCE = 0.85

def get_confidence(probability: float) -> str:
    if probability >= HIGH_CONFIDENCE:
        return "HIGH_CONFIDENCE"
    elif probability >= LOW_CONFIDENCE:
        return "MEDIUM_CONFIDENCE"
    return "LOW_CONFIDENCE"

# =====================================================
# API CONFIG
# =====================================================

API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", 8000))
API_PREFIX = os.getenv("API_PREFIX", "/api")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

CORS_ORIGINS = [
    FRONTEND_URL,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

# =====================================================
# 🌡 SENSOR CONFIG
# =====================================================

USE_SIMULATED_SENSORS = os.getenv("USE_SIMULATED_SENSORS", "true").lower() == "true"
SENSOR_PUSH_INTERVAL = float(os.getenv("SENSOR_PUSH_INTERVAL", 1.0))

SENSOR_FEATURES = [
    "temp_min",
    "temp_max",
    "rain",
    "wind_gust",
    "wind_speed",
    "humidity",
    "pressure",
    "clouds",
]

# =====================================================
# RISK LEVEL SYSTEM
# =====================================================

LOW_RISK_THRESHOLD = 0.50
MODERATE_RISK_THRESHOLD = 0.75
HIGH_RISK_THRESHOLD = 0.90

def get_risk_level(probability: float) -> str:
    if probability >= HIGH_RISK_THRESHOLD:
        return "HIGH"
    elif probability >= MODERATE_RISK_THRESHOLD:
        return "MODERATE"
    return "LOW"

# =====================================================
# DATABASE CONFIG
# =====================================================

USE_FIREBASE = os.getenv("USE_FIREBASE", "false").lower() == "true"

# Firebase
FIREBASE_CREDENTIAL_PATH = os.getenv(
    "FIREBASE_CREDENTIAL_PATH",
    os.path.join(BASE_DIR, "firebase_key.json"),
)

FIREBASE_DB_URL = os.getenv("FIREBASE_DB_URL", "")

# =====================================================
# ALERT SYSTEM
# =====================================================

ENABLE_ALERTS = os.getenv("ENABLE_ALERTS", "true").lower() == "true"

# Twilio
TWILIO_SID = os.getenv("TWILIO_SID", "")
TWILIO_AUTH = os.getenv("TWILIO_AUTH", "")
TWILIO_PHONE = os.getenv("TWILIO_PHONE", "")
ALERT_PHONE = os.getenv("ALERT_PHONE", "")

# Email
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
ALERT_EMAIL = os.getenv("ALERT_EMAIL", "")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))

# =====================================================
# AUTO RETRAINING (HYBRID)
# =====================================================

AUTO_RETRAIN = os.getenv("AUTO_RETRAIN", "false").lower() == "true"

RETRAIN_INTERVAL = timedelta(days=7)
MIN_NEW_RECORDS = int(os.getenv("MIN_NEW_RECORDS", 500))

LSTM_TRAIN_SCRIPT_PATH = os.path.join(ML_DIR, "train_lstm.py")
XGB_TRAIN_SCRIPT_PATH = os.path.join(ML_DIR, "train_xgboost.py")

# =====================================================
# AUTH CONFIG
# =====================================================

JWT_SECRET = os.getenv("JWT_SECRET", "cloudburst-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 1440))

# =====================================================
# LOGGING
# =====================================================

LOG_LEVEL = "DEBUG" if not IS_PRODUCTION else "INFO"
ENABLE_DEBUG_LOGS = not IS_PRODUCTION

# =====================================================
# 🛠 PATH VALIDATION
# =====================================================

def validate_paths():
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(ML_DIR, exist_ok=True)
    os.makedirs(IOT_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    os.makedirs(MODEL_BACKUP_DIR, exist_ok=True)

    if not os.path.exists(CSV_DATA_PATH):
        print("⚠ Training CSV not found:", CSV_DATA_PATH)

validate_paths()

print("Config Loaded | ENV:", ENV)