export default function Topbar({ user }) {
  return (
    <div className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="text-sm text-slate-300">
        Real-Time Cloudburst Monitoring System
      </div>

      <div className="text-xs">
        {user ? (
          <span className="text-green-400">
            Logged in as {user.username}
          </span>
        ) : (
          <span className="text-red-400">Not Logged In</span>
        )}
      </div>
    </div>
  );
}