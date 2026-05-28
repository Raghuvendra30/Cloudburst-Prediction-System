import { useEffect, useState } from "react";

export default function PredictionPanel({
   prediction,
   sensor
}) {

  const [status, setStatus] = useState("connecting");


  const probability =
    Math.round(
      (prediction?.risk_score || 0) * 100
    );

  const isHighRisk =
    prediction?.risk_level === "HIGH";

  return (

    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-xl">

      <h2 className="text-lg font-bold mb-3">
        Live Prediction
      </h2>

      <p className="text-xs text-slate-400 mb-3">
        WebSocket: {status}
      </p>

      {!prediction && (

        <p className="text-sm text-slate-400">
          Waiting for sensor prediction...
        </p>
      )}

      {prediction && (

        <div className="space-y-3">

          {/* RISK */}
          <div>

            <p className="text-sm text-slate-400">
              Cloudburst Risk
            </p>

            <p className="text-3xl font-bold text-cyan-400">

              {probability}%

            </p>

          </div>

          {/* STATUS */}
          <div>

            <p className="text-sm text-slate-400">
              Risk Level
            </p>

            {isHighRisk ? (

              <span className="text-red-400 font-bold">

                HIGH RISK

              </span>

            ) : (

              <span className="text-green-400 font-bold">

                NORMAL

              </span>
            )}

          </div>

          {/* SENSOR DATA */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">

            <div>
              <p className="text-slate-400">
                Temperature
              </p>

              <p className="font-bold">
                {sensor?.temperature || 0}°C
              </p>
            </div>

            <div>
              <p className="text-slate-400">
                Humidity
              </p>

              <p className="font-bold">
                {sensor?.humidity || 0}%
              </p>
            </div>

            <div>
              <p className="text-slate-400">
                Rainfall
              </p>

              <p className="font-bold">
                {sensor?.rainfall || 0} mm
              </p>
            </div>

            <div>
              <p className="text-slate-400">
                Pressure
              </p>

              <p className="font-bold">
                {sensor?.pressure || 0} hPa
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}