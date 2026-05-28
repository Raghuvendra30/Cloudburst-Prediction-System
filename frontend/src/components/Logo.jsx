import { useNavigate } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/")}
      className="group cursor-pointer select-none"
    >
      <div className="flex items-center gap-2">

        {/* Lightning Accent */}
        <div className="relative">
          <span className="text-cyan-400 text-xl group-hover:rotate-12 transition-transform duration-300">
          </span>
          <span className="absolute inset-0 blur-md opacity-60 text-cyan-400">
          </span>
        </div>

        {/* Text Logo */}
        <div className="flex flex-col leading-tight">
          <h1 className="text-xl font-extrabold tracking-widest bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-500 bg-clip-text text-transparent group-hover:brightness-125 transition-all duration-300">
            CLOUDBURST
          </h1>

          <span className="text-[10px] tracking-[0.3em] text-slate-400">
            AI • PREDICT & ALERT
          </span>
        </div>
      </div>
    </div>
  );
}