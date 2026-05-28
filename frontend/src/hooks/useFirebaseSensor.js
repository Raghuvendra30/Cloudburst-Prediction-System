import { useEffect, useState } from "react";
import { subscribeToSensors } from "../services/firebase";

export default function useFirebaseSensor() {

  const [sensorData, setSensorData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    let unsubscribe;

    const fetchPrediction = async (sensor) => {

      try {

        const response = await fetch("http://localhost:8000/api/cloudburst-live", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(sensor)
        });

        const result = await response.json();

        setPrediction(result.prediction);

      } catch (err) {

        console.error("Prediction fetch error:", err);
        setError(err);

      }

    };

    try {

      unsubscribe = subscribeToSensors((data) => {

        if (!data) return;

        const formatted = {
          ...data,
          timestamp: data.timestamp
            ? new Date(data.timestamp)
            : new Date()
        };

        setSensorData(formatted);
        setLoading(false);

        // Send sensor data to backend model
        fetchPrediction(formatted);

      });

    } catch (err) {

      console.error("Firebase sensor stream error:", err);
      setError(err);
      setLoading(false);

    }

    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, []);

  return {
    sensorData,
    prediction,
    loading,
    error
  };
}