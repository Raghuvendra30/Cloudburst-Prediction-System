import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
export default function Navbar({ user, setUser }) {

  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("cloudburst_user");
      localStorage.removeItem("cloudburst_token");
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {

  const handleScroll = () => {

    const currentScrollY = window.scrollY;

    // SHOW when scrolling up
    if (currentScrollY < lastScrollY) {

      setShowNavbar(true);

    }

    // HIDE when scrolling down
    else {

      setShowNavbar(false);

    }

    // ALWAYS SHOW at top
    if (currentScrollY < 10) {

      setShowNavbar(true);

    }

    setLastScrollY(currentScrollY);

  };

  window.addEventListener("scroll", handleScroll);

  return () => {

    window.removeEventListener(
      "scroll",
      handleScroll
    );
  };

}, [lastScrollY]);

  const navItem = (path, label) => {
    const active = location.pathname === path;

    return (
      <button
        onClick={() => navigate(path)}
        className={`relative px-3 py-1 text-sm transition duration-300 group
        ${active ? "text-cyan-400" : "text-slate-300 hover:text-cyan-300"}`}
      >
        {label}

        <span
          className={`absolute left-0 bottom-0 h-[2px] w-full transform transition-all duration-300
          ${active ? "scale-x-100 bg-cyan-400" : "scale-x-0 group-hover:scale-x-100 bg-cyan-300"}`}
        />
      </button>
    );
  };

  return (

    <nav
      className={`fixed top-0 left-0 w-full z-50 h-16
      bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg
      transition-transform duration-500

      ${
        showNavbar
        ? "translate-y-0"
        : "-translate-y-full"
      }`}
    >
      {/* CONTAINER */}
      <div className="relative flex items-center justify-between h-full px-6">

        {/* LEFT - LOGO */}
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer group"
        >
          <p className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
            CLOUDBURST
          </p>
          <p className="text-[10px] text-slate-400 tracking-widest">
            AI • PREDICT • ALERT
          </p>
        </div>

        {/* CENTER - NAV LINKS (FIXED POSITION) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">

          {navItem("/", "Home")}
          {navItem("/dashboard", "Dashboard")}
          {navItem("/control", "AI Control")}

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* STATUS */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">

            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              API
            </span>

            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              WS
            </span>

          </div>

          {/* USER */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl
            bg-white/5 border border-white/10 backdrop-blur-md">

              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold shadow-md">
                {user.email?.charAt(0).toUpperCase()}
              </div>

              <span className="hidden md:block text-slate-300 max-w-[150px] truncate">
                {user.email}
              </span>

            </div>
          )}

          {/* LOGOUT */}
          {user && (
            <button
              onClick={logout}
              className="px-4 py-1 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-red-600 to-pink-600
              hover:scale-105 transition-all shadow-lg"
            >
              Logout
            </button>
          )}

        </div>

      </div>

    </nav>
  );
}