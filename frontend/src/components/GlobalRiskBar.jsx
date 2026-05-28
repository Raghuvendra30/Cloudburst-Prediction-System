export default function GlobalRiskBar({ probability }) {

  const percent = Math.round((probability || 0) * 100);

  // Risk levels
  const level =
    percent > 75 ? "HIGH" :
    percent > 50 ? "MODERATE" :
    "LOW";

  // Color styles
  const color =
    percent > 75
      ? "from-red-500 to-pink-500 shadow-red-500/40"
      : percent > 50
      ? "from-yellow-400 to-orange-400 shadow-yellow-400/40"
      : "from-green-400 to-emerald-500 shadow-green-400/40";

  const isHigh = percent > 75;

  return (

    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-lg">

      {/* TITLE */}
      <div className="flex justify-between items-center mb-2">

        <h3 className="text-sm text-slate-300">
          Global Cloudburst Risk
        </h3>

        <span className={`text-xs font-bold ${
          isHigh ? "text-red-400" :
          percent > 50 ? "text-yellow-400" :
          "text-green-400"
        }`}>
          {level}
        </span>

      </div>

      {/* PROGRESS BAR */}
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">

        <div
          className={`h-3 rounded-full bg-gradient-to-r ${color}
          transition-all duration-700 ease-out
          ${isHigh ? "animate-pulse" : ""}`}
          style={{ width: `${percent}%` }}
        />

      </div>

      {/* FOOTER */}
      <div className="flex justify-between text-xs mt-2 text-slate-300">

        <span>{percent}% Risk</span>

        <span className={`status-text ${
          isHigh ? "status-high" :
          percent > 50 ? "status-mid" :
          "status-low"
        }`}>
          {isHigh
            ? "Immediate Attention Required"
            : percent > 50
            ? "Moderate Instability"
            : "Stable Conditions"}
        </span>

      </div>

    </div>

  );
}