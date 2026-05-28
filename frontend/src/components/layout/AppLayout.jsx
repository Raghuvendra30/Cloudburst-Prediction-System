import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children, user }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col">
        <Topbar user={user} />

        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}