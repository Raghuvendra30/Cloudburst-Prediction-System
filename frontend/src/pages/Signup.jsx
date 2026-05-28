import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

export default function Signup({ setTab }) {

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {

    if (!form.email || !form.password) {
      setMsg("Enter email and password");
      return;
    }

    try {

      setLoading(true);
      setMsg("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      setMsg("Account created successfully!");

      setTimeout(() => {
        setTab("login");
      }, 1500);

    } catch (err) {

      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setMsg("Email already registered");
      } else {
        setMsg("Signup failed");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">

      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">

        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Create Account
        </h1>

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

          {msg && (
            <div className="text-center text-sm text-yellow-300">
              {msg}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500"
          >
            {loading ? "Creating account..." : "Signup"}
          </button>

          <div className="text-center text-sm text-slate-300">
            Already have an account?
            <button
              onClick={() => setTab("login")}
              className="text-cyan-400 ml-2"
            >
              Login
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}