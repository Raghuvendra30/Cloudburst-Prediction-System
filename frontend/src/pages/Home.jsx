import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { useNavigate } from "react-router-dom";

import RainBackground from "../components/RainBackground";
import FogOverlay from "../components/FogOverlay";
import AmbientWeatherSound from "../components/AmbientWeatherSound";
import LightningOverlay from "../components/LightningOverlay";
import GlobeBackground from "../components/GlobeBackground";
import NeuralBackground from "../components/NeuralBackground";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import useWebSocketStatus from "../hooks/useWebSocketStatus";
import useLiveSocket from "../hooks/useLiveSocket";

export default function Home({ user }) {
  
  const {
    connected,
    sensorData,
    prediction,
    graphData
  } = useLiveSocket();
  
  const navigate = useNavigate();

  const { status: wsStatus, latency } =
    useWebSocketStatus("ws://127.0.0.1:8000/ws/live-sensor");

  const [time, setTime] = useState("");
  const [chartData, setChartData] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");

  // ================= REAL DATA =================
  const risk = Math.round(
    (prediction?.risk_score || 0) * 100
  );

  const weather = {

    humidity:
      sensorData?.humidity || 0,

    pressure:
      sensorData?.pressure || 0,

    rainfall:
      sensorData?.rainfall || 0,

    temperature:
      sensorData?.temperature || 0,

    windSpeed:
      sensorData?.wind_speed || 0
  };

  // ================= API STATUS =================
  useEffect(() => {

    const checkAPI = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/health");
        if (!res.ok) throw new Error();
        setApiStatus("online");
      } catch {
        setApiStatus("offline");
      }
    };

    checkAPI();
    const interval = setInterval(checkAPI, 10000);
    return () => clearInterval(interval);

  }, []);

  // ================= CLOCK =================
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        })
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  // ================= LIVE GRAPH =================
  useEffect(() => {

    if (sensorData && prediction) {

      setChartData((prev) => [

        ...prev.slice(-20),

        {

          time: new Date().toLocaleTimeString(),

          risk:
            (prediction?.risk_score || 0) * 100,

          humidity:
            sensorData?.humidity || 0,

          pressure:
            sensorData?.pressure || 0,
        }
      ]);
    }

  }, [sensorData, prediction]);
  console.log("LIVE DATA:", {
    sensorData,
    prediction,
    graphData
  });

  // ================= AI INSIGHT =================
  const generateInsight = () => {

    if (risk > 75)
      return "Severe atmospheric instability detected.";

    if (risk > 50)
      return "Moderate storm formation detected.";

    return "Stable atmospheric conditions.";

  };

  const riskGlow =
    risk > 75
      ? "shadow-red-500/40"
      : risk > 50
      ? "shadow-yellow-400/40"
      : "shadow-emerald-400/40";

  return (

    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">

      <RainBackground />
      <FogOverlay />
      <GlobeBackground />
      <NeuralBackground />
      <AmbientWeatherSound />

      {risk > 75 && <LightningOverlay />}

      <div className={`absolute inset-0 blur-3xl opacity-20 ${riskGlow}`} />

      {/* TOP BAR */}
      <div className="relative z-10 w-full px-6 py-4 flex justify-between items-center">
        <Logo />

        <div className="flex gap-4 text-xs text-slate-300">
          <span>{time}</span>
          <StatusIndicator label="API" status={apiStatus} />
          <StatusIndicator label="WebSocket" status={wsStatus} />
          {latency && <span>{latency}ms</span>}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10">

        {/* LEFT */}
        <div className="space-y-6">

          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
            Cloudburst Intelligence Engine
          </h1>

          <p className="text-slate-300">
            Real-time AI monitoring using IoT sensor network.
          </p>

          <div className="w-40 h-40 mx-auto">
            <CircularProgressbar
              value={risk}
              text={`${risk}%`}
              styles={buildStyles({
                textColor: "#fff",
                pathColor:
                  risk > 75 ? "#ef4444" :
                  risk > 50 ? "#facc15" :
                  "#22c55e"
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <WeatherCard label="Humidity" value={`${weather.humidity}%`} />
            <WeatherCard label="Pressure" value={`${weather.pressure} hPa`} />
            <WeatherCard label="Rainfall" value={`${weather.rainfall} mm`} />
            <WeatherCard label="Temperature" value={`${weather.temperature}°C`} />
            <WeatherCard label="Wind Speed" value={`${weather.windSpeed} km/h`} />
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <p className="font-bold mb-2">AI Insight</p>
            {generateInsight()}
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => navigate("/dashboard")} className="px-6 py-3 bg-blue-600 rounded-xl">
              Dashboard
            </button>
            <button onClick={() => navigate("/control")} className="px-6 py-3 bg-purple-600 rounded-xl">
              AI Control Center
            </button>
          </div>

        </div>

        {/* RIGHT */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

          <h3 className="text-xl font-bold mb-4">
            Atmospheric Trend
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <Tooltip />
              <Legend />
              <Line dataKey="risk" stroke="#22d3ee" dot={false} />
              <Line dataKey="humidity" stroke="#10b981" dot={false} />
              <Line dataKey="pressure" stroke="#f97316" dot={false} />
            </LineChart>
          </ResponsiveContainer>

        </div>

      </div>

      <div className="text-center text-xs text-slate-400 py-6">
        © {new Date().getFullYear()} Cloudburst AI
      </div>

    </div>
  );
}

// ================= COMPONENTS =================

function WeatherCard({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-lg font-bold text-cyan-400 mt-1">{value}</p>
    </div>
  );
}

function StatusIndicator({ label, status }) {
  const map = {
    online: "bg-green-400",
    offline: "bg-red-500",
    connecting: "bg-yellow-400"
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full animate-pulse ${map[status]}`} />
      <span>{label}</span>
    </div>
  );
}
