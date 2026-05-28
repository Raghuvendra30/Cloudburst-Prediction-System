import { useState } from "react";
import { predictCloudburst } from "../services/api";

export default function SensorForm({ setPrediction, setHistory }) {
  const [data, setData] = useState({
    temperature: "",
    humidity: "",
    pressure: "",
    rainfall: "",
    lat: 12.9716,
    lon: 77.5946
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validate = () => {
    const { temperature, humidity, pressure, rainfall } = data;

    if (
      temperature === "" ||
      humidity === "" ||
      pressure === "" ||
      rainfall === ""
    ) {
      return "All sensor fields are required.";
    }

    return "";
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formattedData = {
        ...data,
        temperature: Number(data.temperature),
        humidity: Number(data.humidity),
        pressure: Number(data.pressure),
        rainfall: Number(data.rainfall),
        lat: Number(data.lat),
        lon: Number(data.lon)
      };

      const res = await predictCloudburst(formattedData);

      setPrediction(res);

      // Keep last 15 probability values
      setHistory(h => [...h.slice(-14), res.probability]);

    } catch (err) {
      setError("Prediction failed. Check backend connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300 hover:shadow-cyan-500/20">

      <h2 className="text-2xl font-bold mb-5 text-cyan-400 tracking-wide">
        Live Sensor Input
      </h2>

      {/* Sensor Inputs */}
      <div className="space-y-3">
        {["temperature", "humidity", "pressure", "rainfall"].map(k => (
          <div key={k}>
            <label className="text-sm text-slate-400 capitalize">
              {k}
            </label>
            <input
              type="number"
              step="any"
              placeholder={`Enter ${k}`}
              className="w-full mt-1 p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              value={data[k]}
              onChange={e => handleChange(k, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Location Section */}
      <div className="mt-4">
        <h3 className="text-sm text-slate-400 mb-2">Location</h3>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            className="p-3 rounded-lg text-black focus:ring-2 focus:ring-cyan-400 transition"
            value={data.lat}
            onChange={e => handleChange("lat", e.target.value)}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            className="p-3 rounded-lg text-black focus:ring-2 focus:ring-cyan-400 transition"
            value={data.lon}
            onChange={e => handleChange("lon", e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm mt-3 animate-pulse">
          ⚠ {error}
        </p>
      )}

      {/* Button */}
      <button
        onClick={submit}
        disabled={loading}
        className={`w-full py-3 rounded-xl mt-6 font-bold text-lg transition-all duration-300 
          ${
            loading
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-400 hover:scale-105 shadow-lg shadow-cyan-500/30"
          }`}
      >
        {loading ? "Analyzing..." : "Predict Cloudburst"}
      </button>
    </div>
  );
}