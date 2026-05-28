from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime
from typing import List
import asyncio

from backend.auth import hash_password, verify_password, create_access_token, decode_token
from backend.db.firebase import get_sensor_data, push_sensor_data
from backend.ml.hybrid_predictor import hybrid_predict
from backend.utils.alerts import send_sms_alert, send_email_alert
from backend.config import API_PREFIX, CORS_ORIGINS, ENABLE_ALERTS

app = FastAPI(title="Cloudburst Hybrid Prediction API")

# ====================================
# GLOBAL SENSOR BUFFER (NEW)
# ====================================
latest_sensor_data = {}

# ====================================
# CORS
# ====================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{API_PREFIX}/login")

# ====================================
# WEBSOCKET CONNECTION MANAGER
# ====================================
class ConnectionManager:

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):

        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):

        dead = []

        for connection in self.active_connections:

            try:
                await connection.send_json(message)
            except:
                dead.append(connection)

        for conn in dead:
            self.disconnect(conn)


manager = ConnectionManager()

# ====================================
# SCHEMAS
# ====================================
class SignupRequest(BaseModel):
    username: str
    password: str
    role: str = "user"


class LoginRequest(BaseModel):
    username: str
    password: str


class SensorData(BaseModel):
    temp_min: float
    temp_max: float
    rain: float
    wind_gust: float
    wind_speed: float
    humidity: float
    pressure: float
    clouds: float


class AlertRequest(BaseModel):
    message: str


# ====================================
# AUTH HELPERS
# ====================================
def get_current_user(token: str = Depends(oauth2_scheme)):

    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


def require_admin(user=Depends(get_current_user)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    return user


# ====================================
# BASIC ROUTES
# ====================================
@app.get("/")
def root():
    return {"success": True, "message": "Cloudburst Hybrid API running"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "time": str(datetime.utcnow())
    }


# ====================================
# REALTIME WEBSOCKET FOR FRONTEND
# ====================================
@app.websocket("/ws/live-sensor")
async def websocket_live_sensor(websocket: WebSocket):

    await manager.connect(websocket)

    try:

        while True:

            global latest_sensor_data

            # ONLY send if sensor data exists
            if latest_sensor_data:

                try:

                    cloudburst, prob, details = hybrid_predict(

                        temp_min=latest_sensor_data.get("temp_min", 0),

                        temp_max=latest_sensor_data.get("temp_max", 0),

                        rain=latest_sensor_data.get("rain", 0),

                        wind_gust=latest_sensor_data.get("wind_gust", 5),

                        wind_speed=latest_sensor_data.get("wind_speed", 5),

                        humidity=latest_sensor_data.get("humidity", 0),

                        pressure=latest_sensor_data.get("pressure", 0),

                        clouds=latest_sensor_data.get("clouds", 50)
                    )

                    payload = {

                        "type": "LIVE_SENSOR_PREDICTION",

                        "sensor": {

                            "temperature":
                                latest_sensor_data.get("temp_min", 0),

                            "humidity":
                                latest_sensor_data.get("humidity", 0),

                            "rainfall":
                                latest_sensor_data.get("rain", 0),

                            "pressure":
                                latest_sensor_data.get("pressure", 0),

                            "wind_speed":
                                latest_sensor_data.get("wind_speed", 0),

                            "clouds":
                                latest_sensor_data.get("clouds", 0),

                            "latitude":
                                latest_sensor_data.get("latitude", 0),

                            "longitude":
                                latest_sensor_data.get("longitude", 0),
                        },

                        "prediction": {

                            "risk_score": float(prob),

                            "risk_level":
                                "HIGH" if cloudburst else "LOW"
                        },

                        "timestamp": str(datetime.utcnow())
                    }

                    await websocket.send_json(payload)

                except Exception as e:

                    await websocket.send_json({

                        "type": "ERROR",

                        "message": str(e)
                    })

            else:

                await websocket.send_json({

                    "type": "HEARTBEAT",

                    "timestamp": str(datetime.utcnow())
                })

            await asyncio.sleep(3)

    except WebSocketDisconnect:

        manager.disconnect(websocket)

# ====================================
# GET LATEST SENSOR DATA (FOR FRONTEND)
# ====================================

@app.get("/api/latest")
async def get_latest():

    data = get_sensor_data()

    if not data:
        return {}

    return {
        "temperature": data.get("temperature"),
        "humidity": data.get("humidity"),
        "rainfall": data.get("rain"),
        "pressure": data.get("pressure"),
        "wind_speed": 5,
        "clouds": 50,
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
    }

# ====================================
# PREDICTION ENDPOINT (FOR FRONTEND)
# ====================================
@app.get("/api/predict")
async def predict_from_firebase():

    data = get_sensor_data()

    if not data:
        return {"error": "No sensor data"}

    try:
        cloudburst, prob, details = hybrid_predict(
            temp_min=data["temperature"],
            temp_max=data["temperature"],
            rain=data["rain"],
            wind_gust=5,
            wind_speed=5,
            humidity=data["humidity"],
            pressure=data["pressure"],
            clouds=50
        )

        return {
            "risk": prob,
            "level": "HIGH" if cloudburst else "LOW"
        }

    except Exception as e:
        return {"error": str(e)}
    
# ====================================
# RECEIVE SENSOR DATA (FROM IOT DEVICES)
# ====================================

@app.post(f"{API_PREFIX}/sensor-data")
async def receive_sensor_data(data: dict):

    global latest_sensor_data

    try:
        # Identify sensor type
        sensor_type = data.get("type")

        # ---------------- MERGE DATA ----------------
        if sensor_type == "rain":
            latest_sensor_data["rain"] = data.get("rainfall")

        elif sensor_type == "pressure":
            latest_sensor_data["pressure"] = data.get("pressure")

        elif sensor_type == "dht":
            latest_sensor_data["temp_min"] = data.get("temperature")
            latest_sensor_data["temp_max"] = data.get("temperature")
            latest_sensor_data["humidity"] = data.get("humidity")

        elif sensor_type == "gps":
            latest_sensor_data["latitude"] = data.get("latitude")
            latest_sensor_data["longitude"] = data.get("longitude")

        # Default values (if not available yet)
        latest_sensor_data.setdefault("wind_speed", 5)
        latest_sensor_data.setdefault("wind_gust", 5)
        latest_sensor_data.setdefault("clouds", 50)
        latest_sensor_data["timestamp"] = datetime.utcnow()
        
        print("Aggregated Data:", latest_sensor_data)

        # ---------------- CHECK IF READY ----------------
        required = ["temp_min", "humidity", "pressure", "rain"]

        if all(k in latest_sensor_data for k in required):

            cloudburst, prob, details = hybrid_predict(
                temp_min=latest_sensor_data["temp_min"],
                temp_max=latest_sensor_data["temp_max"],
                rain=latest_sensor_data["rain"],
                wind_gust=latest_sensor_data["wind_gust"],
                wind_speed=latest_sensor_data["wind_speed"],
                humidity=latest_sensor_data["humidity"],
                pressure=latest_sensor_data["pressure"],
                clouds=latest_sensor_data["clouds"]
            )

            result = {
                "timestamp": str(datetime.utcnow()),
                "sensor": latest_sensor_data.copy(),
                "prediction": {
                    "risk_score": float(prob),
                    "risk_level": "HIGH" if cloudburst else "LOW"
                },
                "location": {
                    "lat": latest_sensor_data.get("latitude"),
                    "lng": latest_sensor_data.get("longitude")
                }
            }

            # Save
            push_sensor_data("Prediction_logs", result)

            # Send to frontend
            await manager.broadcast({
                "type": "LIVE_SENSOR_PREDICTION",
                "sensor": latest_sensor_data,
                "prediction": {
                    "risk_score": float(prob),
                    "risk_level": "HIGH" if cloudburst else "LOW"
                },
                "location": {
                    "lat": latest_sensor_data.get("latitude"),
                    "lng": latest_sensor_data.get("longitude")
                },
                })

            # Alerts
            if ENABLE_ALERTS and cloudburst:
                msg = f"⚠ CLOUD BURST ALERT ⚠\nProbability: {prob:.2f}"
                send_sms_alert(msg)
                send_email_alert("Cloudburst Alert", msg)

            return {
                "status": "prediction_done",
                "risk": result["prediction"]
            }

        return {
            "status": "waiting",
            "received": sensor_type
        }

    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}
    

# ====================================
# SIGNUP
# ====================================
@app.post(f"{API_PREFIX}/signup")
def signup(data: SignupRequest):

    existing = get_sensor_data("users", {"username": data.username})

    if existing:
        return {"success": False, "message": "User already exists"}

    push_sensor_data("users", {
        "username": data.username,
        "password": hash_password(data.password),
        "role": data.role,
        "created_at": str(datetime.utcnow())
    })

    return {"success": True, "message": "Signup successful"}


# ====================================
# LOGIN
# ====================================
@app.post(f"{API_PREFIX}/login")
def login(data: LoginRequest):

    user = get_sensor_data("users", {"username": data.username})

    if not user:
        return {"success": False, "message": "User not found"}

    if not verify_password(data.password, user["password"]):
        return {"success": False, "message": "Wrong password"}

    token = create_access_token({
        "username": user["username"],
        "role": user["role"]
    })

    return {
        "success": True,
        "access_token": token,
        "role": user["role"]
    }