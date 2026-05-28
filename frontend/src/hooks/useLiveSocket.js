import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8000/ws/live-sensor";

export default function useLiveSocket() {

    const wsRef = useRef(null);

    const [connected, setConnected] = useState(false);

    const [sensorData, setSensorData] = useState(null);

    const [prediction, setPrediction] = useState(null);

    const [graphData, setGraphData] = useState([]);

    useEffect(() => {

        let reconnectTimeout;

        const connectWebSocket = () => {

            try {

                const ws = new WebSocket(WS_URL);

                wsRef.current = ws;

                ws.onopen = () => {

                    console.log("WebSocket connected");

                    setConnected(true);
                };

                ws.onmessage = (event) => {

                    try {

                        const data = JSON.parse(event.data);

                        console.log("WS DATA:", data);

                        // Ignore heartbeat
                        if (data.type === "HEARTBEAT") {
                            return;
                        }

                        // Ignore invalid payload
                        if (!data.sensor || !data.prediction) {
                            return;
                        }

                        // Save sensor
                        setSensorData(data.sensor);

                        // Save prediction
                        setPrediction(data.prediction);

                        // Update graph
                        setGraphData((prev) => [

                            ...prev.slice(-20),

                            {
                                time: new Date().toLocaleTimeString(),

                                humidity:
                                    data.sensor.humidity || 0,

                                pressure:
                                    data.sensor.pressure || 0,

                                risk:
                                    data.prediction.risk_score || 0,
                            }
                        ]);

                    } catch (err) {

                        console.error(
                            "WebSocket parse error:",
                            err
                        );
                    }
                };

                ws.onerror = (err) => {

                    console.error(
                        "WebSocket error:",
                        err
                    );
                };

                ws.onclose = () => {

                    console.warn(
                        "WebSocket disconnected. Reconnecting..."
                    );

                    setConnected(false);

                    reconnectTimeout = setTimeout(() => {

                        connectWebSocket();

                    }, 3000);
                };

            } catch (err) {

                console.error(
                    "Socket connection failed:",
                    err
                );
            }
        };

        connectWebSocket();

        return () => {

            clearTimeout(reconnectTimeout);

            if (wsRef.current) {

                wsRef.current.close();
            }
        };

    }, []);

    return {

        connected,

        sensorData,

        prediction,

        graphData
    };
}