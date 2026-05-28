import os
import firebase_admin
from firebase_admin import credentials, db
from firebase_admin import _apps
from backend.config import FIREBASE_CREDENTIAL_PATH


# =============================
# INITIALIZE FIREBASE
# =============================
def initialize_firebase():
    if not _apps:
        if not os.path.exists(FIREBASE_CREDENTIAL_PATH):
            raise FileNotFoundError(
                f"Firebase key not found at {FIREBASE_CREDENTIAL_PATH}"
            )

        if os.path.getsize(FIREBASE_CREDENTIAL_PATH) == 0:
            raise ValueError("Firebase credential file is empty")

        cred = credentials.Certificate(FIREBASE_CREDENTIAL_PATH)

        firebase_admin.initialize_app(
            cred,
            {
                "databaseURL": os.getenv("FIREBASE_DB_URL")
            },
        )

        print("Firebase initialized successfully")


initialize_firebase()


# =============================
# GET DATA (Realtime DB)
# =============================
def get_sensor_data():
    try:
        ref = db.reference("IoT_Project")
        data = ref.get()

        if not data:
            return None

        return {
            "temperature": data.get("DHT22", {}).get("Temperature_C", 0),
            "humidity": data.get("DHT22", {}).get("Humidity_%", 0),
            "pressure": data.get("BMP280", {}).get("Pressure_hPa", 0),
            "altitude": data.get("BMP280", {}).get("Altitude_m", 0),
            "rain": data.get("RainSensor", {}).get("RainPercent", 0),
            "rain_category": data.get("RainSensor", {}).get("Category", "UNKNOWN"),
            "latitude": data.get("GPS", {}).get("Latitude", 0),
            "longitude": data.get("GPS", {}).get("Longitude", 0),
        }

    except Exception as e:
        print("Firebase read error:", e)
        return None

# =============================
# PUSH DATA (Dynamic Collection)
# =============================
def push_sensor_data(collection_name: str, data: dict):
    try:
        ref = db.reference(collection_name)
        ref.push(data)
        return True
    except Exception as e:
        print("Firebase write error:", e)
        return False

# =============================
# GET LATEST SENSOR DATA
# =============================
def get_latest_sensor_data(collection_name: str):

    try:

        ref = db.reference(collection_name)

        data = ref.order_by_key().limit_to_last(1).get()

        if not data:
            return None

        for key, value in data.items():
            value["id"] = key
            return value

    except Exception as e:
        print("Firebase latest data error:", e)
        return None