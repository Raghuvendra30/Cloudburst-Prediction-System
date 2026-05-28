from backend.db.fetch_firebase_data import get_latest_sensor_data
from backend.ml.hybrid_predictor import predict_from_sensor
from datetime import datetime
import logging


# =========================================================
# REQUIRED SENSOR FEATURES FOR MODEL
# =========================================================

REQUIRED_FEATURES = [
    "temperature",
    "humidity",
    "pressure",
    "rainfall",
    "wind_speed"
]


# =========================================================
# OPTIONAL FEATURES (FOR MAP / ADVANCED DASHBOARD)
# =========================================================

OPTIONAL_FEATURES = [
    "latitude",
    "longitude"
]


# =========================================================
# VALIDATE SENSOR DATA
# =========================================================

def validate_sensor_data(sensor_data: dict):
    """
    Ensure required features exist
    Convert all values to float
    """

    cleaned = {}

    for feature in REQUIRED_FEATURES:
        value = sensor_data.get(feature, 0)

        try:
            cleaned[feature] = float(value)
        except:
            cleaned[feature] = 0.0

    return cleaned


# =========================================================
# EXTRACT LOCATION DATA
# =========================================================

def extract_location(sensor_data: dict):

    lat = sensor_data.get("latitude")
    lng = sensor_data.get("longitude")

    if lat is None or lng is None:
        return None

    try:
        return {
            "lat": float(lat),
            "lng": float(lng)
        }
    except:
        return None


# =========================================================
# MAIN FUNCTION
# FETCH FIREBASE DATA + RUN PREDICTION
# =========================================================

def get_live_prediction():
    """
    Fetch latest sensor data from Firebase
    Run ML model prediction
    Return formatted result for dashboard
    """

    try:

        # -------------------------------------------------
        # Get sensor data
        # -------------------------------------------------

        sensor_data = get_latest_sensor_data()

        if not sensor_data:
            logging.warning("No sensor data found in Firebase")

            return {
                "status": "no_data",
                "timestamp": datetime.utcnow().isoformat(),
                "sensor": None,
                "prediction": None,
                "location": None
            }

        # -------------------------------------------------
        # Clean / validate sensor values
        # -------------------------------------------------

        cleaned_sensor = validate_sensor_data(sensor_data)

        # -------------------------------------------------
        # Extract location (optional)
        # -------------------------------------------------

        location = extract_location(sensor_data)

        # -------------------------------------------------
        # Run prediction
        # -------------------------------------------------

        prediction = predict_from_sensor(cleaned_sensor)
        if prediction and "risk_score" in prediction:
            prediction["risk_score"] = float(prediction["risk_score"])

        # -------------------------------------------------
        # Format response for frontend
        # -------------------------------------------------

        result = {

            "status": "success",

            "timestamp": datetime.utcnow().isoformat(),

            "sensor": {
                "temperature": cleaned_sensor["temperature"],
                "humidity": cleaned_sensor["humidity"],
                "pressure": cleaned_sensor["pressure"],
                "rainfall": cleaned_sensor["rainfall"],
                "wind_speed": cleaned_sensor["wind_speed"]
            },

            "prediction": prediction,

            "location": location
        }

        return result


    except Exception as e:

        logging.error(f"Prediction error: {e}")

        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "message": str(e),
            "sensor": None,
            "prediction": None,
            "location": None
        }