import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Legend
);

export default function ChartPanel({ history = [] }) {

  const chartData = useMemo(() => {

    const labels = history.map((_, i) => i + 1);

    const riskData = history.map(
      (h) => h?.risk || 0
    );

    const humidityData = history.map(
      (h) => h?.humidity || 0
    );

    const pressureData = history.map(
      (h) => h?.pressure || 0
    );

    return {
      labels,
      datasets: [

        // RISK
        {
          label: "Cloudburst Risk (%)",
          data: riskData,
          borderColor: "#22d3ee",
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;

            if (!chartArea) return "rgba(34,211,238,0.1)";

            const gradient = c.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );

            gradient.addColorStop(0, "rgba(34,211,238,0.4)");
            gradient.addColorStop(1, "rgba(34,211,238,0.02)");

            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 2,
        },

        // HUMIDITY
        {
          label: "Humidity (%)",
          data: humidityData,
          borderColor: "#10b981",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
        },

        // PRESSURE
        {
          label: "Pressure (hPa)",
          data: pressureData,
          borderColor: "#f97316",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
        },

      ],
    };

  }, [history]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        labels: { color: "#cbd5e1" },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        borderColor: "#22d3ee",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#cbd5e1",
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(255,255,255,0.05)" },
        min: 0,
        max: 100,
      },
    },
  };

  return (

    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">

      <h2 className="text-lg font-bold text-white mb-4">
        Live Atmospheric Trends
      </h2>

      <div className="w-full h-[260px]">

        {history.length === 0 ? (

          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Waiting for real-time sensor data...
          </div>

        ) : (

          <Line data={chartData} options={options} />

        )}

      </div>

    </div>
  );
}