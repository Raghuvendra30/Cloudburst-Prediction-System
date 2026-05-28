"""
Live Sensor Monitor (for Multi-ESP32 System)
------------------------------------------
• Reads latest merged sensor data from backend
• Displays real-time values
• Sends data into FastAPI prediction pipeline
• Enables frontend live graphs + predictions
"""

import time
import logging
import requests

from backend.config import API_HOST, API_PORT, API_PREFIX

# ================= LOGGER =================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | SENSOR | %(message)s",
    datefmt="%H:%M:%S"
)

print("LIVE SENSOR MONITOR STARTED")

# ================= ENDPOINTS =================

# Fetch merged sensor values
FETCH_ENDPOINT = (
    f"http://{API_HOST}:{API_PORT}{API_PREFIX}/latest"
)

# Send sensor values into prediction API
SEND_ENDPOINT = (
    f"http://{API_HOST}:{API_PORT}"
    f"{API_PREFIX}/sensor-data"
)

# ================= FETCH FUNCTION =================

def fetch_latest_data():

    try:

        response = requests.get(
            FETCH_ENDPOINT,
            timeout=5
        )

        if response.status_code == 200:

            return response.json()

        else:

            logging.warning(
                f"API Error {response.status_code}"
            )

            return None

    except Exception as e:

        logging.error(f"Fetch error: {e}")

        return None

# ================= SEND TO FASTAPI =================

def send_to_prediction_pipeline(data):

    try:

        # ---------------- DHT SENSOR ----------------

        dht_payload = {

            "type": "dht",

            "temperature": data.get("temperature", 0),

            "humidity": data.get("humidity", 0)
        }

        requests.post(
            SEND_ENDPOINT,
            json=dht_payload,
            timeout=5
        )

        # ---------------- RAIN SENSOR ----------------

        rain_payload = {

            "type": "rain",

            "rainfall": data.get("rainfall", 0)
        }

        requests.post(
            SEND_ENDPOINT,
            json=rain_payload,
            timeout=5
        )

        # ---------------- PRESSURE SENSOR ----------------

        pressure_payload = {

            "type": "pressure",

            "pressure": data.get("pressure", 0)
        }

        requests.post(
            SEND_ENDPOINT,
            json=pressure_payload,
            timeout=5
        )

        # ---------------- GPS SENSOR ----------------

        gps_payload = {

            "type": "gps",

            "latitude": data.get("latitude", 0),

            "longitude": data.get("longitude", 0)
        }

        requests.post(
            SEND_ENDPOINT,
            json=gps_payload,
            timeout=5
        )

    except Exception as e:

        logging.error(
            f"Prediction pipeline error: {e}"
        )

# ================= DISPLAY =================

def display_data(data):

    try:

        msg = (

            f"T={data.get('temperature')}°C | "

            f"H={data.get('humidity')}% | "

            f"R={data.get('rainfall')}mm | "

            f"P={data.get('pressure')}hPa | "

            f"W={data.get('wind_speed')}m/s | "

            f"C={data.get('clouds')}% | "

            f"Lat={data.get('latitude')} | "

            f"Lon={data.get('longitude')}"
        )

        logging.info(msg)

    except Exception as e:

        logging.error(f"Display error: {e}")

# ================= MAIN LOOP =================

def run_monitor():

    while True:

        data = fetch_latest_data()

        if data:

            # Display values
            display_data(data)

            # Send into prediction system
            send_to_prediction_pipeline(data)

        else:

            logging.warning(
                "Waiting for sensor data..."
            )

        time.sleep(3)

# ================= ENTRY =================

if __name__ == "__main__":

    run_monitor()