import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ControlCenter from "./pages/ControlCenter";

import AmbientWeatherSound from "./components/AmbientWeatherSound";

export default function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* -------- Firebase Session Restore -------- */

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {

      if (firebaseUser) {

        setUser({
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          role: "user"
        });

      } else {

        setUser(null);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);

  /* -------- Loading Screen -------- */

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

        <div className="animate-spin h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full" />

      </div>

    );

  }

  return (

    <>

      <AmbientWeatherSound />

      {/* key forces page remount to avoid white screen */}
      <Routes>

        {/* Home */}
        <Route
          path="/"
          element={<Home user={user} />}
        />

        {/* Auth */}
        <Route
          path="/auth"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <AuthPage setUser={setUser} user={user} />
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            user
              ? <Dashboard user={user} setUser={setUser} />
              : <Navigate to="/auth" replace />
          }
        />

        {/* Control Center */}
        <Route
          path="/control"
          element={
            user
              ? <ControlCenter user={user} />
              : <Navigate to="/auth" replace />
          }
        />

        {/* Catch All */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </>

  );

}