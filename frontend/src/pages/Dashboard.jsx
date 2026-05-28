import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import PredictionPanel from "../components/PredictionPanel";
import ChartPanel from "../components/ChartPanel";
import MapView from "../components/MapView";
import AlertPanel from "../components/AlertPanel";
import LiveAlertToast from "../components/LiveAlertToast";
import GlobalRiskBar from "../components/GlobalRiskBar";

import LightningOverlay from "../components/LightningOverlay";
import RainParticles from "../components/RainParticles";
import WindFlow from "../components/WindFlow";

import useLiveSocket from "../hooks/useLiveSocket";

export default function Dashboard({ user, setUser }) {

  const {
  sensorData,
  prediction,
  graphData
} = useLiveSocket();
  const [location, setLocation] = useState(null);
  const [alert, setAlert] = useState(null);
  const [history, setHistory] = useState([]);
  const isHighRisk = prediction?.risk_score > 0.75;

  useEffect(() => {

  if (!sensorData || !prediction) return;

  setLocation({
    lat: sensorData?.latitude || 0,
    lng: sensorData?.longitude || 0
  });

  setHistory(prev => [

   ...prev.slice(-20),

   {

      time:
         new Date().toLocaleTimeString(),

      risk:
         (prediction?.risk_score || 0) * 100,

      humidity:
         sensorData?.humidity || 0,

      pressure:
         sensorData?.pressure || 0
   }
]);

  if (prediction?.risk_score > 0.75) {

    setAlert({

      probability: prediction.risk_score,

      username: user?.email,

      sensorData: sensorData
    });
  }

}, [sensorData, prediction, user]);

  return (

    <div className="min-h-screen relative text-white overflow-hidden">

      {/* GLOBAL ALERT */}
      {isHighRisk && (
        <>
          <div className="fixed inset-0 bg-red-500/10 animate-pulse z-20 pointer-events-none" />

          <div className="risk-alert fixed top-24 left-1/2 -translate-x-1/2 z-40
            bg-red-600 px-6 py-2 rounded-xl font-bold animate-bounce pointer-events-none">
            HIGH CLOUDBURST RISK
          </div>
        </>
      )}

      {/* BACKGROUND (SAFE CLICK PASS) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <RainParticles />
        <WindFlow />
        <LightningOverlay probability={prediction?.risk_score} />
      </div>

      {/* CONTENT */}
      <div className="relative z-10">

        {/* NAVBAR (ALWAYS TOP) */}
        <Navbar user={user} setUser={setUser} />

        {/* ALERT TOAST */}
        <LiveAlertToast alert={alert} onClose={() => setAlert(null)} />

        {/* GLOBAL RISK */}
        <div className="px-6 pt-24">
          <GlobalRiskBar probability={prediction?.risk_score || 0} />
        </div>

        {/* TOP GRID */}
        <div className="p-6 grid lg:grid-cols-3 gap-6">

          <PredictionPanel
            prediction={prediction}
            sensor={sensorData}
          />

          <ChartPanel history={history} />

        </div>

        {/* BOTTOM GRID */}
        <div className="p-6 grid md:grid-cols-2 gap-6">

          <MapView
            latitude={location?.lat || sensorData?.latitude}
            longitude={location?.lng || sensorData?.longitude}
            rainfall={sensorData?.rain || sensorData?.rainfall || 0}
            risk={prediction?.risk_level}
          />

          <AlertPanel prediction={prediction} />

        </div>

      </div>

    </div>
  );
}