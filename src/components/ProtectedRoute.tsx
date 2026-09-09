import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../services/api";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7FA]">
        <div className="w-8 h-8 border-2 border-[#080512]/20 border-t-[#080512] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // preserve intended destination — LoginPage already reads ?redirect=
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "TRAINER") return <Navigate to="/trainer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}