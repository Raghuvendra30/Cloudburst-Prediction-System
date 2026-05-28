import { useEffect, useState, useRef } from "react";

export default function useWebSocketStatus(
  url = "ws://127.0.0.1:8000/ws/live-sensor"
) {

  const [status, setStatus] = useState("connecting");
  const [latency, setLatency] = useState(null);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {

    let ws;
    let pingTime;

    const connect = () => {

      setStatus("connecting");

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {

        setStatus("online");

        // send ping to measure latency
        pingTime = Date.now();

        try {
          ws.send(JSON.stringify({ type: "PING" }));
        } catch (err) {
          console.warn("Ping failed:", err);
        }

      };

      ws.onmessage = (event) => {

        try {

          const data = JSON.parse(event.data);

          // latency check
          if (data.type === "PONG") {

            const diff = Date.now() - pingTime;
            setLatency(diff);

          }

          // backend heartbeat
          if (data.type === "HEARTBEAT") {

            if (pingTime) {
              const diff = Date.now() - pingTime;
              setLatency(diff);
            }

          }

        } catch (err) {
          console.warn("WS message parse error:", err);
        }

      };

      ws.onerror = (err) => {

        console.warn("WebSocket error:", err);
        setStatus("offline");

      };

      ws.onclose = () => {

        setStatus("offline");

        // reconnect after 3 seconds
        reconnectRef.current = setTimeout(() => {

          console.log("Reconnecting WebSocket...");
          connect();

        }, 3000);

      };

    };

    connect();

    return () => {

      clearTimeout(reconnectRef.current);

      if (wsRef.current) {
        wsRef.current.close();
      }

    };

  }, [url]);

  return { status, latency };

}