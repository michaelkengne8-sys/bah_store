import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="flex items-center gap-3 text-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
          <span className="text-sm font-medium">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated || state.user?.role !== "admin") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}