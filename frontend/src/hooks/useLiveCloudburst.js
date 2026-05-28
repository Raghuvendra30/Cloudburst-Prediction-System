import { useEffect, useState } from "react";

export default function useLiveCloudburst() {

  const [sensor, setSensor] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {

    const ws = new WebSocket("ws://localhost:8000/ws/live-sensor");

    ws.onopen = () => {
      console.log("Live Cloudburst Stream Connected");
      setStatus("connected");
    };

    ws.onmessage = (event) => {

      try {

        const msg = JSON.parse(event.data);

        if (msg.type === "LIVE_UPDATE") {

          const sensorData = msg.data.sensor;
          const predictionData = msg.data.prediction;

          setSensor(sensorData);
          setPrediction(predictionData);

          setHistory(prev => {
            const updated = [...prev, predictionData.risk_score * 100];
            return updated.slice(-20);
          });

        }

      } catch (err) {
        console.error("Live stream error:", err);
      }

    };

    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");

    return () => ws.close();

  }, []);

  return { sensor, prediction, history, status };

}