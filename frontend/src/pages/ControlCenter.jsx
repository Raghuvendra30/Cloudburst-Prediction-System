import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import ThreeGlobe from "../components/ThreeGlobe";
import RainParticles from "../components/RainParticles";
import WindFlow from "../components/WindFlow";
import LightningStrikes from "../components/LightningStrikes";

import MapView from "../components/MapView";
import PredictionPanel from "../components/PredictionPanel";
import ChartPanel from "../components/ChartPanel";
import AlertPanel from "../components/AlertPanel";
import ExplainabilityPanel from "../components/ExplainabilityPanel";
import useLiveSocket from "../hooks/useLiveSocket";

export default function ControlCenter({ user }) {
  const {
    sensorData,
    prediction,
    graphData,
    connected
  } = useLiveSocket();

  const [location, setLocation] = useState(null);
  const [socketStatus, setSocketStatus] = useState("connecting");

  return (

    <div className="min-h-screen pt-24 text-white relative overflow-hidden">

      {/* Background Effects */}
      <RainParticles />
      <WindFlow />
      <LightningStrikes probability={0.85} />
      <ThreeGlobe />

      <Navbar user={user} />z

      {/* Connection Status */}
      <div className="absolute top-20 right-6 text-sm bg-black/40 px-3 py-1 rounded">
        Socket: {socketStatus}
      </div>

      {/* Prediction + Charts + Alerts */}

      <div className="p-6 grid lg:grid-cols-3 gap-6">

        <PredictionPanel
          prediction={prediction}
          sensor={sensorData}
          connected={connected}
        />

        <ChartPanel history={graphData} />

        <AlertPanel
          riskLevel={prediction?.risk_level || "Unknown"}
          rainfall={sensorData?.rainfall || 0}
        />

      </div>

      {/* Map + Explainability */}

      <div className="p-6 grid lg:grid-cols-2 gap-6">

        <MapView
          latitude={location?.lat || sensorData?.latitude || 30.7333}
          longitude={location?.lng || sensorData?.longitude || 76.7794}
          rainfall={sensorData?.rainfall || 0}
          risk={prediction?.risk_level}
        />

        <ExplainabilityPanel
          factors={[
            { name: "Humidity Rise", impact: sensorData?.humidity || 0 },
            { name: "Pressure Drop", impact: sensorData?.pressure || 0 },
            { name: "Rainfall Spike", impact: sensorData?.rainfall || 0 },
            { name: "Wind Speed", impact: sensorData?.wind_speed || 0 }
          ]}
        />

      </div>

    </div>
  );
}