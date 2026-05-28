export default function RiskGauge({ prediction }) {

  if (!prediction) return null;

  const risk = prediction.risk_score * 100;

  const color =
    risk > 70 ? "text-red-400" :
    risk > 40 ? "text-yellow-400" :
    "text-green-400";

  return (

    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-xl">

      <h2 className="text-lg font-bold mb-3">
        AI Risk Gauge
      </h2>

      <div className={`text-4xl font-bold ${color}`}>
        {risk.toFixed(1)}%
      </div>

      <p className="text-sm mt-2">
        {prediction.risk_level}
      </p>

    </div>

  );

}