from backend.db.firebase import get_sensor_data
import time

# ================= CONFIG =================
SYNC_THRESHOLD = 10  # seconds (allowed difference)


# ================= SAFE FLOAT =================
def safe_float(value):
    try:
        return float(value)
    except:
        return 0.0


# ================= GET TIMESTAMP =================
def get_timestamp(sensor_node):
    return int(sensor_node.get("Timestamp", 0))


# =========================================
# GET SYNCHRONIZED SENSOR DATA
# =========================================
def get_latest_sensor_data():

    data = get_sensor_data("IoT_Project")

    if not data:
        print("Warning: No data found in Firebase")
        return None

    dht = data.get("DHT22", {})
    bmp = data.get("BMP280", {})
    gps = data.get("GPS", {})
    rain = data.get("RainSensor", {})

    # -------- Extract timestamps --------
    t_dht = get_timestamp(dht)
    t_bmp = get_timestamp(bmp)
    t_gps = get_timestamp(gps)
    t_rain = get_timestamp(rain)

    timestamps = [t_dht, t_bmp, t_gps, t_rain]

    # Remove zeros
    valid_times = [t for t in timestamps if t > 0]

    if not valid_times:
        print("Warning: No valid timestamps available")
        return None

    # -------- Check synchronization --------
    max_time = max(valid_times)
    min_time = min(valid_times)

    if (max_time - min_time) > SYNC_THRESHOLD:
        print("Warning: Sensor data not synchronized")
        print(f"Time difference: {max_time - min_time} seconds")

        # OPTIONAL: still return latest data (fallback)
        # return None

    # -------- Build merged sensor data --------
    sensor_data = {
        "temperature": safe_float(dht.get("Temperature_C")),
        "humidity": safe_float(dht.get("Humidity_%")),
        "pressure": safe_float(bmp.get("Pressure_hPa")),
        "rainfall": safe_float(rain.get("RainPercent")),

        "latitude": safe_float(gps.get("Latitude")),
        "longitude": safe_float(gps.get("Longitude")),

        "timestamp": max_time
    }

    return sensor_data