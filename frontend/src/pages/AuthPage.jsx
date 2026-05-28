import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Login from "./Login";
import Signup from "./Signup";
import RainBackground from "../components/RainBackground";
import FogOverlay from "../components/FogOverlay";
import Logo from "../components/Logo"; // ADD THIS

export default function AuthPage({ setUser, user }) {
  const [tab, setTab] = useState("login");

  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || "/dashboard";

  /* ---------------- AUTO REDIRECT ---------------- */
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  /* ---------------- RESTORE SESSION ---------------- */
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("cloudburst_user");
      const token = localStorage.getItem("cloudburst_token");

      if (saved && token) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      }
    }
  }, [setUser, user]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">

      {/* Background FX */}
      <RainBackground />
      <FogOverlay />

      {/* Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden animate-fadeInUp">

          {/* LOGO SECTION */}
          <div
            onClick={() => navigate("/")}
            className="flex flex-col items-center justify-center py-6 cursor-pointer group"
          >
            <div className="transform transition group-hover:scale-105">
              <Logo />
            </div>

            <p className="text-xs text-slate-400 mt-2 group-hover:text-cyan-300 transition">
              Go to Home
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`py-3 font-bold transition ${
                tab === "login"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  : "bg-white/5 hover:bg-white/10 text-slate-200"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`py-3 font-bold transition ${
                tab === "signup"
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                  : "bg-white/5 hover:bg-white/10 text-slate-200"
              }`}
            >
              Signup
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {tab === "login" ? (
              <Login
                setUser={setUser}
                redirectPath={redirectPath}
                setTab={setTab}
              />
            ) : (
              <Signup setTab={setTab} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}