import { Navigate, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { state, hydrated } = useAuth();
  const location = useLocation();

  // Show loading while auth is hydrating
  if (!hydrated || state.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-accent-400 animate-spin" />
          <p className="text-ink-300 font-medium">Loading your account...</p>
        </div>
      </motion.div>
    );
  }

  if (!state.isAuthenticated) {
    // Redirect to login with current path as redirect parameter
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}