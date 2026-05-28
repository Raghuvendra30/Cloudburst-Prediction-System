import { useEffect, useRef } from "react";

export default function useLiveRisk(setRisk, setStatus) {

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  useEffect(() => {

    const connect = () => {

      const WS_URL =
        import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/risk";

      const ws = new WebSocket(WS_URL);

      wsRef.current = ws;

      if (setStatus) setStatus("connecting");

      /* ---------------- OPEN ---------------- */

      ws.onopen = () => {

        console.log("Risk WebSocket connected");

        if (setStatus) setStatus("online");

      };

      /* ---------------- MESSAGE ---------------- */

      ws.onmessage = (event) => {

        try {

          const data = JSON.parse(event.data);

          if (data?.risk !== undefined) {
            setRisk(data.risk);
          }

        } catch (err) {

          console.warn("Invalid WebSocket message:", err);

        }

      };

      /* ---------------- ERROR ---------------- */

      ws.onerror = (err) => {

        console.error("WebSocket error:", err);

        if (setStatus) setStatus("error");

      };

      /* ---------------- CLOSE ---------------- */

      ws.onclose = () => {

        console.warn("Risk WebSocket disconnected");

        if (setStatus) setStatus("offline");

        reconnectTimer.current = setTimeout(connect, 3000);

      };

    };

    connect();

    /* ---------------- CLEANUP ---------------- */

    return () => {

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }

    };

  }, [setRisk, setStatus]);

}