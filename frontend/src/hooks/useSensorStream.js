import { useEffect, useRef } from "react";

export default function useSensorStream(mode, onData) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    if (mode !== "live") return;

    let reconnectAttempts = 0;

    const connect = () => {
      if (wsRef.current) return; // prevent duplicate connections

      const ws = new WebSocket("ws://127.0.0.1:8000/ws/live-sensor");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Sensor WebSocket connected");
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onData?.(data);
        } catch (err) {
          console.error("Invalid WebSocket data:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.warn("Sensor WebSocket closed");

        wsRef.current = null;

        // Auto reconnect (max 5 attempts)
        if (reconnectAttempts < 5) {
          reconnectAttempts++;
          reconnectRef.current = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [mode, onData]);
}