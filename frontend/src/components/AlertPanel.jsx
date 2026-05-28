import { useState } from "react";
import { sendAdminSMS, sendAdminEmail } from "../services/api";

export default function AlertPanel({ prediction }) {
  const [smsText, setSmsText] = useState("");
  const [emailText, setEmailText] = useState("");
  const [msg, setMsg] = useState("");

  const cloudburst = prediction?.cloudburst === true;
  const prob =
    typeof prediction?.probability === "number"
      ? prediction.probability.toFixed(3)
      : "-";

  const autoMessage = () => {
    const sensor = prediction?.sensor || {};
    return `Cloudburst Alert!\nProbability: ${prob}\nTemp: ${sensor.temperature ?? "-"}\nHumidity: ${sensor.humidity ?? "-"}\nPressure: ${sensor.pressure ?? "-"}\nRainfall: ${sensor.rainfall ?? "-"}`;
  };

  const handleAutoFill = () => {
    const text = autoMessage();
    setSmsText(text);
    setEmailText(text);
    setMsg("Auto message generated");
  };

  const handleSendSMS = async () => {
    if (!smsText.trim()) return setMsg("Enter SMS message first");
    try {
      const res = await sendAdminSMS(smsText);
      if (res?.success === false) setMsg("SMS not sent");
      else setMsg("SMS Sent Successfully");
    } catch (e) {
      setMsg("SMS sending failed");
    }
  };

  const handleSendEmail = async () => {
    if (!emailText.trim()) return setMsg("Enter Email message first");
    try {
      const res = await sendAdminEmail(emailText);
      if (res?.success === false) setMsg("Email not sent");
      else setMsg("Email Sent Successfully");
    } catch (e) {
      setMsg("Email sending failed");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-white">Alerts</h3>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            cloudburst
              ? "bg-red-500/20 text-red-200 border border-red-500/30"
              : "bg-green-500/20 text-green-200 border border-green-500/30"
          }`}
        >
          {cloudburst ? "CLOUDBURST RISK" : "SAFE"}
        </span>
      </div>

      <p className="text-sm text-slate-300">
        Probability: <span className="font-bold text-white">{prob}</span>
      </p>

      {msg && (
        <div
          className={`text-sm text-center p-2 rounded-xl border ${
            msg.includes("not")
              ? "text-red-300 border-red-500/30 bg-red-500/10"
              : msg.includes("alert")
              ? "text-yellow-200 border-yellow-500/30 bg-yellow-500/10"
              : "text-green-300 border-green-500/30 bg-green-500/10"
          }`}
        >
          {msg}
        </div>
      )}

      <button
        onClick={handleAutoFill}
        className="w-full py-2 rounded-xl font-bold bg-white/10 border border-white/10 hover:bg-white/15 transition"
      >
        Auto Generate Alert Message
      </button>

      {/* SMS */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-200">Send SMS</p>
        <textarea
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="Write SMS message..."
          className="w-full min-h-[100px] p-3 rounded-xl bg-slate-900/70 border border-white/10 text-white outline-none focus:border-blue-500 transition"
        />
        <button
          onClick={handleSendSMS}
          className="w-full py-2 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition"
        >
          Send SMS
        </button>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-200">Send Email</p>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Write Email message..."
          className="w-full min-h-[100px] p-3 rounded-xl bg-slate-900/70 border border-white/10 text-white outline-none focus:border-purple-500 transition"
        />
        <button
          onClick={handleSendEmail}
          className="w-full py-2 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition"
        >
          Send Email
        </button>
      </div>
    </div>
  );
}