backend run: python -m backend.ml.train_lstm
uvicorn backend.app:app --reload  
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
# Terminal 1
cd backend
venv\Scripts\activate
python -m backend.ml.train_lstm
uvicorn backend.app:app --reload

# Terminal 2 (optional)
python -m backend.services.firebase_collector

# Terminal 3 (optional)
python -m backend.iot.sensor_receiver

# Terminal 4
cd frontend
npm run dev