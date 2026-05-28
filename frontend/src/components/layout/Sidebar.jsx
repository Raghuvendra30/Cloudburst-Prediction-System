import { useNavigate } from "react-router-dom";

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  return (
    <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 hidden lg:flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-extrabold mb-8 text-cyan-300">
          Cloudburst AI
        </h2>

        <nav className="space-y-3 text-sm">
          <Nav label="Home" onClick={() => navigate("/")} />
          <Nav label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav label="Auth" onClick={() => navigate("/auth")} />

          {user?.role === "admin" && (
            <Nav label="Admin Panel" onClick={() => navigate("/dashboard")} />
          )}
        </nav>
      </div>

      <div className="text-xs text-slate-400">
        © {new Date().getFullYear()}
      </div>
    </div>
  );
}

function Nav({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 rounded-xl hover:bg-white/10 transition"
    >
      {label}
    </button>
  );
}