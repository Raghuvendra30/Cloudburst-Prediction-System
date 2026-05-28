import { useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

export default function Login({ setUser, setTab }) {

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  const submit = async () => {

    if (!form.email || !form.password) {
      setMsg("Enter email and password");
      return;
    }

    try {

      setLoading(true);
      setMsg("");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // GET FIREBASE TOKEN
      const token = await user.getIdToken();

      const userObj = {
        email: user.email,
        uid: user.uid
      };

      // SAVE TOKEN
      localStorage.setItem("cloudburst_token", token);
      localStorage.setItem("cloudburst_user", JSON.stringify(userObj));

      setMsg("Login successful!");
      setSuccessMode(true);

      setTimeout(() => {
        setUser(userObj);
      }, 700);

    } catch (err) {

      console.error(err);
      setMsg("Invalid email or password");

    } finally {

      setLoading(false);

    }
  };

  const strength = useMemo(() => {

    const p = form.password || "";
    let score = 0;

    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1)
      return { label: "Weak", width: "25%", color: "bg-red-500" };

    if (score === 2)
      return { label: "Fair", width: "45%", color: "bg-yellow-500" };

    if (score === 3)
      return { label: "Good", width: "70%", color: "bg-blue-500" };

    return { label: "Strong", width: "100%", color: "bg-green-500" };

  }, [form.password]);

  useEffect(() => {

    const handleEnter = (e) => {
      if (e.key === "Enter") submit();
    };

    window.addEventListener("keydown", handleEnter);

    return () => window.removeEventListener("keydown", handleEnter);

  }, [form]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">

      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">

        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Cloudburst Login
        </h1>

        {successMode ? (

          <div className="text-center text-green-400">
            Login successful! Redirecting...
          </div>

        ) : (

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
            />

            <div className="text-xs text-slate-300">
              Password strength: {strength.label}
            </div>

            {msg && (
              <div className="text-center text-sm text-red-400">
                {msg}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center text-sm text-slate-300">
              Don't have an account?
              <button
                onClick={() => setTab("signup")}
                className="text-cyan-400 ml-2"
              >
                Signup
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}