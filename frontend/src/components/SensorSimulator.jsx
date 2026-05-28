import { predictCloudburst } from "../services/api";
import { useState } from "react";

export default function SensorSimulator({ setPrediction, setHistory }) {
  const [running, setRunning] = useState(false);
  let timer = null;

  const randomData = () => ({
    temperature: 20 + Math.random() * 15,
    humidity: 60 + Math.random() * 35,
    pressure: 980 + Math.random() * 30,
    rainfall: Math.random() * 80,
    lat: 12.9716 + (Math.random() - 0.5) * 0.2,
    lon: 77.5946 + (Math.random() - 0.5) * 0.2
  });

  const start = () => {
    if (running) return;
    setRunning(true);

    timer = setInterval(async () => {
      const res = await predictCloudburst(randomData());
      setPrediction(res);
      setHistory(h => [...h.slice(-14), res.probability]);
    }, 3000);

    window.simTimer = timer;
  };

  const stop = () => {
    setRunning(false);
    clearInterval(window.simTimer);
  };

  return (
    <div className="bg-slate-800 p-5 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Sensor Simulator (Admin)</h2>

      <div className="flex gap-3">
        <button
          onClick={start}
          className="bg-purple-600 px-4 py-2 rounded font-bold w-full"
        >
          Start Live Simulation
        </button>

        <button
          onClick={stop}
          className="bg-red-600 px-4 py-2 rounded font-bold w-full"
        >
          Stop
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Sends sensor data every 3 seconds automatically.
      </p>
    </div>
  );
}