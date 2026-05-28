import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  // Wait until Firebase auth finishes loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading Cloudburst AI...
      </div>
    );
  }

  // If not logged in → redirect
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If logged in → render page
  return children;
}