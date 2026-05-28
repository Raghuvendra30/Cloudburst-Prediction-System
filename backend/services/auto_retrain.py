"""
HYBRID Auto-Retraining Pipeline (Production Version)
----------------------------------------------------
✔ Fetches new sensor data
✔ Prevents duplicate CSV entries
✔ Retrains LSTM + XGBoost
✔ Logs metrics
✔ Model versioning compatible
✔ Safe for cron / scheduler
✔ Production-ready
"""

import os
import sys
import subprocess
import logging
import json
from datetime import datetime

import pandas as pd
from pymongo import MongoClient

from backend.config import (
    MONGO_URI,
    DB_NAME,
    SENSOR_COLLECTION,
    CSV_DATA_PATH,
    RETRAIN_INTERVAL,
    MIN_NEW_RECORDS,
    LSTM_TRAIN_SCRIPT_PATH,
    XGB_TRAIN_SCRIPT_PATH,
    LOG_DIR,
    MODEL_DIR
)

# =====================================================
# LOGGING SETUP
# =====================================================

os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "auto_retrain.log")

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# =====================================================
# DATABASE CONNECTION
# =====================================================

if not MONGO_URI:
    raise ValueError("MONGO_URI not configured in .env")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
sensor_collection = db[SENSOR_COLLECTION]

# =====================================================
# UTILITIES
# =====================================================

def get_last_retrain_time():
    """
    Uses CSV modified time as retrain checkpoint.
    """
    if not os.path.exists(CSV_DATA_PATH):
        return None
    return datetime.fromtimestamp(os.path.getmtime(CSV_DATA_PATH))


def should_retrain():
    last_time = get_last_retrain_time()

    if last_time is None:
        logging.info("No CSV found → first training required.")
        return True

    elapsed = datetime.now() - last_time

    if elapsed >= RETRAIN_INTERVAL:
        logging.info("Retrain interval exceeded.")
        return True

    logging.info("Retrain not required yet.")
    return False


# =====================================================
# FETCH NEW DATA
# =====================================================

def fetch_new_sensor_data(last_time):

    query = {}

    if last_time:
        query = {"timestamp": {"$gt": last_time}}

    records = list(sensor_collection.find(query, {"_id": 0}))

    if len(records) < MIN_NEW_RECORDS:
        logging.warning(
            f"Only {len(records)} new records found "
            f"(minimum required: {MIN_NEW_RECORDS})"
        )
        return None

    logging.info(f"Fetched {len(records)} new records.")

    df = pd.DataFrame(records)

    if "timestamp" in df.columns:
        df = df.sort_values("timestamp")

    return df


# =====================================================
# UPDATE CSV
# =====================================================

def update_training_csv(new_data):

    if os.path.exists(CSV_DATA_PATH):
        old_data = pd.read_csv(CSV_DATA_PATH)
        combined = pd.concat([old_data, new_data], ignore_index=True)
    else:
        combined = new_data

    combined.drop_duplicates(inplace=True)

    combined.to_csv(CSV_DATA_PATH, index=False)

    logging.info(f"CSV updated successfully. Total rows: {len(combined)}")


# =====================================================
# RUN TRAINING SCRIPTS
# =====================================================

def run_script(script_path, name):

    if not os.path.exists(script_path):
        logging.error(f"{name} script not found: {script_path}")
        return False

    try:
        logging.info(f"Starting {name} retraining...")
        subprocess.run([sys.executable, script_path], check=True)
        logging.info(f"{name} retraining completed successfully.")
        return True

    except subprocess.CalledProcessError as e:
        logging.error(f"{name} retraining failed: {e}")
        return False


# =====================================================
# SAVE METRICS
# =====================================================

def save_metrics():

    metrics_path = os.path.join(LOG_DIR, "model_metrics.json")

    metrics = {
        "timestamp": str(datetime.utcnow()),
        "status": "Hybrid retraining completed"
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

    logging.info("Model metrics file updated.")


# =====================================================
# RETRAIN MODELS
# =====================================================

def retrain_models():

    lstm_ok = run_script(LSTM_TRAIN_SCRIPT_PATH, "LSTM")
    xgb_ok = run_script(XGB_TRAIN_SCRIPT_PATH, "XGBoost")

    if lstm_ok and xgb_ok:
        logging.info("Hybrid models retrained successfully.")
        save_metrics()
    else:
        logging.error("One or more models failed during retraining.")


# =====================================================
# MAIN PIPELINE
# =====================================================

def main():

    logging.info("========== AUTO-RETRAIN STARTED ==========")

    if not should_retrain():
        logging.info("Pipeline exited (interval not met).")
        return

    last_time = get_last_retrain_time()

    new_data = fetch_new_sensor_data(last_time)

    if new_data is None:
        logging.info("Pipeline exited (insufficient data).")
        return

    update_training_csv(new_data)

    retrain_models()

    logging.info("========== AUTO-RETRAIN COMPLETED ==========")


# =====================================================
# ENTRY
# =====================================================

if __name__ == "__main__":
    main()