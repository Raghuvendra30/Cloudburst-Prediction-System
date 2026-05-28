import { useEffect, useMemo } from "react";

export default function LiveAlertToast({ alert, onClose }) {

  /* ---------------- AUTO CLOSE ---------------- */

  useEffect(() => {

    if (!alert) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);

  }, [alert]);


  /* ---------------- ALERT SOUND ---------------- */

  useEffect(() => {

    if (!alert) return;

    const audio = new Audio("/sounds/thunder.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});

  }, [alert]);


  /* ---------------- SEVERITY LEVEL ---------------- */

  const severity = useMemo(() => {

    const p = alert?.probability || 0;

    if (p > 0.85) return "critical";
    if (p > 0.7) return "high";
    return "medium";

  }, [alert]);


  const severityStyles = {
    critical: "border-red-500 bg-red-500/15 animate-pulse",
    high: "border-orange-400 bg-orange-400/10",
    medium: "border-yellow-400 bg-yellow-400/10"
  };


  if (!alert) return null;


  return (

    <div className="fixed top-6 right-6 z-[9999] w-[340px] animate-[slideIn_0.4s_ease]">

      <div
        className={`rounded-2xl border backdrop-blur-xl shadow-2xl p-4 ${severityStyles[severity]}`}
      >

        <div className="flex items-start justify-between gap-3">

          <div>

            <h3 className="text-lg font-extrabold text-red-300 flex items-center gap-2">
              ⚠ Cloudburst Alert
            </h3>

            <p className="text-xs text-slate-200 mt-1">
              User: <b>{alert?.username || alert?.email || "Unknown"}</b>
            </p>

            <p className="text-xs text-slate-200 mt-1">
              Probability: <b>{alert?.probability?.toFixed(3)}</b>
            </p>

            <p className="text-xs text-slate-300 mt-1">
              Temp: {alert?.sensor?.temperature ?? "-"}°C | Hum: {alert?.sensor?.humidity ?? "-"}%
            </p>

            <p className="text-xs text-slate-300 mt-1">
              Pressure: {alert?.sensor?.pressure ?? "-"} | Rain: {alert?.sensor?.rainfall ?? "-"}
            </p>

            <p className="text-[10px] text-slate-400 mt-2">
              Severity: {severity.toUpperCase()}
            </p>

          </div>


          {/* CLOSE BUTTON */}

          <button
            onClick={onClose}
            className="text-slate-200 hover:text-white transition text-lg"
            title="Close"
          >
            ✖
          </button>

        </div>


        {/* TIMER BAR */}

        <div className="mt-3">

          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">

            <div
              className="h-1 bg-red-400 w-full animate-[shrink_5s_linear]"
            />

          </div>

        </div>

      </div>


      {/* ANIMATIONS */}

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(40px);
              opacity: 0;
            }
            to {
              transform: translateX(0px);
              opacity: 1;
            }
          }

          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>

    </div>

  );
}