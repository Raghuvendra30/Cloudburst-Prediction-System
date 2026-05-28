# 🌩️ Cloudburst Prediction System

An AI-powered real-time cloudburst prediction and disaster monitoring system built using LSTM Deep Learning, FastAPI, React, Firebase, and IoT sensor integration.

The system analyzes weather and environmental sensor data to predict potential cloudburst events and provide early warning alerts through an interactive dashboard.


# 🚀 Features

* 🌧️ Real-time cloudburst prediction
* 🧠 LSTM deep learning model
* 📡 IoT sensor integration
* 🔥 Firebase real-time data streaming
* ⚡ FastAPI backend APIs
* 🎨 Interactive React frontend dashboard
* 📊 Live weather analytics and visualization
* 🚨 Early warning alert system
* 📈 Real-time monitoring architecture
* 🔄 Scalable full-stack system


# 🛠️ Tech Stack

| Category         | Technologies                   |
| ---------------- | ------------------------------ |
| Frontend         | React.js, Vite, Tailwind CSS   |
| Backend          | FastAPI, Python                |
| Machine Learning | TensorFlow, LSTM, Scikit-learn |
| Database         | Firebase Realtime Database     |
| Data Processing  | Pandas, NumPy                  |
| Visualization    | Matplotlib, Charts             |
| IoT Integration  | Sensor Receiver                |
| Deployment Ready | REST APIs                      |


# 🏗️ System Architecture

IoT Sensors
      ↓
Firebase Realtime Database
      ↓
FastAPI Backend APIs
      ↓
LSTM Deep Learning Model
      ↓
Prediction Engine
      ↓
React Dashboard & Alerts


# 📂 Project Structure

LSTM1/
│
├── backend/
│   ├── app.py
│   ├── ml/
│   ├── services/
│   ├── iot/
│   └── credentials/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── requirements.txt
├── .gitignore
└── README.md


# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

git clone https://github.com/Raghuvendra30/Cloudburst-Prediction-System.git

cd Cloudburst-Prediction-System


# 🐍 Backend Setup

## Create Virtual Environment

python -m venv venv

## Activate Virtual Environment

### Windows

venv\Scripts\activate

### Linux / Mac

source venv/bin/activate


## Install Backend Dependencies

pip install -r requirements.txt


# 🧠 Train LSTM Model

python -m backend.ml.train_lstm


# ⚡ Run FastAPI Backend

uvicorn backend.app:app --reload

OR

uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload


# 🔥 Firebase Collector (Optional)

python -m backend.services.firebase_collector


# 📡 IoT Sensor Receiver (Optional)

python -m backend.iot.sensor_receiver


# 🎨 Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Run frontend:

npm run dev


# ▶️ Running Complete System

## Terminal 1 — Backend + Model

cd backend
venv\Scripts\activate
python -m backend.ml.train_lstm
uvicorn backend.app:app --reload


## Terminal 2 — Firebase Collector

python -m backend.services.firebase_collector


## Terminal 3 — IoT Sensor Receiver

python -m backend.iot.sensor_receiver


## Terminal 4 — Frontend

cd frontend
npm run dev


# 📊 Machine Learning Model

The project uses an LSTM (Long Short-Term Memory) neural network model to analyze sequential weather and environmental sensor data for predicting cloudburst events.

## 📥 Input Parameters

* Rainfall
* Temperature
* Humidity
* Atmospheric Pressure
* Wind-related sensor values

## 📤 Output

* Cloudburst prediction
* Risk probability
* Alert status
* Weather analytics


# 🌍 Real-World Applications

* Disaster management systems
* Smart weather monitoring
* Early warning systems
* Environmental monitoring
* Smart city infrastructure
* Emergency response systems


# 📸 Screenshots

> Add your project screenshots here for a professional GitHub appearance.

## Dashboard

screenshots/dashboard.png

## Prediction Graphs

screenshots/graphs.png

## Alert Monitoring System

screenshots/alerts.png


# 🔮 Future Enhancements

* ☁️ Cloud deployment
* 📱 Mobile application
* 📩 SMS/Email emergency alerts
* 🛰️ Satellite weather integration
* 🤖 Advanced AI forecasting
* 📊 Enhanced analytics dashboard
* 🌐 Multi-region monitoring


# 🔐 Security & Environment Variables

Sensitive files such as:

* Firebase credentials
* API keys
* Environment variables

are excluded using `.gitignore` for security purposes.


# 👨‍💻 Author

## Raghuvendra Singh

AI & Full Stack Developer

### Skills

* Machine Learning
* Deep Learning
* FastAPI
* React.js
* Firebase
* IoT Integration
* TensorFlow
* Full Stack Development


# 📜 License

This project is developed for educational, research, and learning purposes.


# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
