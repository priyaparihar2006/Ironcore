import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('USER' | 'TRAINER' | 'ADMIN')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9FD] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#080512] flex items-center justify-center shadow-lg animate-pulse mb-4">
          <div className="w-5 h-5 border-2 border-white rounded-full"></div>
        </div>
        <div className="text-sm font-bold text-[#080512] tracking-tight">
          Securing Session...
        </div>
        <div className="text-xs text-neutral-400 mt-1">Verifying IronCore access</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect according to the user's rightful dashboard
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'TRAINER') {
      return <Navigate to="/trainer" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
