import LiveAlertToast from "./LiveAlertToast";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAllUsers,
  fetchAllLogs,
  sendAdminSMS,
  sendAdminEmail,
} from "../services/api";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [smsMsg, setSmsMsg] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  const [msg, setMsg] = useState("");

  // LIVE POPUP ALERT STATE
  const [liveAlert, setLiveAlert] = useState(null);

  // Search + Filters
  const [userSearch, setUserSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [cloudburstOnly, setCloudburstOnly] = useState(false);

  // WebSocket live status
  const [wsStatus, setWsStatus] = useState("DISCONNECTED");
  const wsRef = useRef(null);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetchAllUsers();
      if (res?.success) setUsers(res.users || []);
    } catch (e) {
      console.log(e);
      setMsg("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetchAllLogs();
      if (res?.success) setLogs(res.logs || []);
    } catch (e) {
      console.log(e);
      setMsg("Failed to load logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadUsers();
    loadLogs();
  }, []);

  // Connect WebSocket for LIVE logs + LIVE POPUP ALERT
  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/api/ws/logs");
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("CONNECTED");
      setMsg("Live logs connected");
    };

    ws.onclose = () => {
      setWsStatus("DISCONNECTED");
      setMsg("Live logs disconnected");
    };

    ws.onerror = () => {
      setWsStatus("ERROR");
      setMsg("WebSocket error");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "LIVE_LOG") {
          const liveLog = payload.data;

          // Push new log at top
          setLogs((prev) => [liveLog, ...prev].slice(0, 100));

          // Trigger popup if cloudburst detected
          if (liveLog.cloudburst === true) {
            setLiveAlert(liveLog);

            // Sound alert (works in most browsers after first interaction)
            try {
              const audio = new Audio(
                "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
              );
              audio.play();
            } catch (err) {
              console.log("Sound blocked by browser:", err);
            }
          }
        }
      } catch (e) {
        console.log("WS message parse error:", e);
      }
    };

    // Keep Alive Ping
    const pingTimer = setInterval(() => {
      if (ws.readyState === 1) {
        ws.send("ping");
      }
    }, 4000);

    return () => {
      clearInterval(pingTimer);
      ws.close();
    };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const totalLogs = logs.length;
    const cloudbursts = logs.filter((l) => l.cloudburst === true).length;

    return { totalUsers, admins, totalLogs, cloudbursts };
  }, [users, logs]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.username || "").toLowerCase().includes(q));
  }, [users, userSearch]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();

    let out = logs;

    if (cloudburstOnly) {
      out = out.filter((l) => l.cloudburst === true);
    }

    if (!q) return out;

    return out.filter((l) => {
      const user = (l.username || "").toLowerCase();
      const role = (l.role || "").toLowerCase();
      const time = (l.timestamp || "").toLowerCase();

      return user.includes(q) || role.includes(q) || time.includes(q);
    });
  }, [logs, logSearch, cloudburstOnly]);

  // Export Logs CSV
  const exportLogsCSV = () => {
    if (!filteredLogs.length) {
      setMsg("No logs to export");
      return;
    }

    const headers = [
      "timestamp",
      "username",
      "role",
      "probability",
      "cloudburst",
      "temperature",
      "humidity",
      "pressure",
      "rainfall",
    ];

    const rows = filteredLogs.map((l) => {
      const s = l.sensor || {};
      return [
        l.timestamp || "",
        l.username || "",
        l.role || "",
        typeof l.probability === "number" ? l.probability : "",
        l.cloudburst ? "YES" : "NO",
        s.temperature ?? "",
        s.humidity ?? "",
        s.pressure ?? "",
        s.rainfall ?? "",
      ];
    });

    const csvContent =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "cloudburst_logs.csv";
    link.click();

    URL.revokeObjectURL(url);

    setMsg("Exported logs CSV successfully");
  };

  const handleSendSMS = async () => {
    if (!smsMsg.trim()) return setMsg("Enter SMS message first");
    try {
      const res = await sendAdminSMS(smsMsg);
      if (res?.success === false) {
        setMsg("SMS not sent (alerts disabled / config issue)");
      } else {
        setMsg("SMS Alert Sent Successfully");
        setSmsMsg("");
      }
    } catch (e) {
      setMsg("SMS sending failed");
    }
  };

  const handleSendEmail = async () => {
    if (!emailMsg.trim()) return setMsg("Enter Email message first");
    try {
      const res = await sendAdminEmail(emailMsg);
      if (res?.success === false) {
        setMsg("Email not sent (alerts disabled / config issue)");
      } else {
        setMsg("Email Alert Sent Successfully");
        setEmailMsg("");
      }
    } catch (e) {
      setMsg("Email sending failed");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* LIVE POPUP TOAST */}
      <LiveAlertToast alert={liveAlert} onClose={() => setLiveAlert(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-white">Admin Panel</h3>
          <p className="text-xs text-slate-300 mt-1">
            Live Logs Status:{" "}
            <span
              className={`font-bold ${
                wsStatus === "CONNECTED"
                  ? "text-green-300"
                  : wsStatus === "ERROR"
                  ? "text-red-300"
                  : "text-yellow-200"
              }`}
            >
              {wsStatus}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadUsers}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
          >
            Refresh Users
          </button>

          <button
            onClick={loadLogs}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
          >
            Refresh Logs
          </button>

          <button
            onClick={exportLogsCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:opacity-90 transition text-sm font-bold"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Message */}
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

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <p className="text-xs text-slate-300">Total Users</p>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalUsers}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <p className="text-xs text-slate-300">Admins</p>
          <p className="text-2xl font-extrabold text-white">{stats.admins}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <p className="text-xs text-slate-300">Total Logs</p>
          <p className="text-2xl font-extrabold text-white">
            {stats.totalLogs}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <p className="text-xs text-slate-300">Cloudburst Logs</p>
          <p className="text-2xl font-extrabold text-red-300">
            {stats.cloudbursts}
          </p>
        </div>
      </div>

      {/* USERS */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h4 className="font-bold text-white">Users</h4>

          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search username..."
            className="w-full md:w-72 px-4 py-2 rounded-xl bg-slate-900/70 border border-white/10 text-white outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm text-slate-200">
            <thead className="text-slate-300">
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2">Username</th>
                <th className="text-left py-2 px-2">Role</th>
                <th className="text-left py-2 px-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-2 px-2 font-semibold">{u.username}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        u.role === "admin"
                          ? "bg-purple-500/20 text-purple-200"
                          : "bg-blue-500/20 text-blue-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {u.created_at ? String(u.created_at).slice(0, 19) : "-"}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={3}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOGS */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h4 className="font-bold text-white">Live Logs</h4>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full md:w-72 px-4 py-2 rounded-xl bg-slate-900/70 border border-white/10 text-white outline-none focus:border-purple-500 transition"
            />

            <label className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cloudburstOnly}
                onChange={() => setCloudburstOnly(!cloudburstOnly)}
              />
              Cloudburst Only
            </label>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm text-slate-200">
            <thead className="text-slate-300">
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2">Time</th>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Prob</th>
                <th className="text-left py-2 px-2">Cloudburst</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-2 px-2 text-slate-300">
                    {l.timestamp ? String(l.timestamp).slice(0, 19) : "-"}
                  </td>
                  <td className="py-2 px-2 font-semibold">
                    {l.username || "-"}
                  </td>
                  <td className="py-2 px-2">
                    {typeof l.probability === "number"
                      ? l.probability.toFixed(3)
                      : "-"}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        l.cloudburst
                          ? "bg-red-500/20 text-red-200"
                          : "bg-green-500/20 text-green-200"
                      }`}
                    >
                      {l.cloudburst ? "YES" : "NO"}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={4}>
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALERTS */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
        <h4 className="font-bold text-white mb-4">Manual Alerts</h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-sm text-slate-300 font-semibold">Send SMS</p>
            <textarea
              value={smsMsg}
              onChange={(e) => setSmsMsg(e.target.value)}
              placeholder="Enter SMS alert message..."
              className="w-full min-h-[110px] p-3 rounded-xl bg-slate-900/70 border border-white/10 text-white outline-none focus:border-blue-500 transition"
            />
            <button
              onClick={handleSendSMS}
              className="w-full py-2 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition"
            >
              Send SMS
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-300 font-semibold">Send Email</p>
            <textarea
              value={emailMsg}
              onChange={(e) => setEmailMsg(e.target.value)}
              placeholder="Enter email alert message..."
              className="w-full min-h-[110px] p-3 rounded-xl bg-slate-900/70 border border-white/10 text-white outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={handleSendEmail}
              className="w-full py-2 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition"
            >
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}