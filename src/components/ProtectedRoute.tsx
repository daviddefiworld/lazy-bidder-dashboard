import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardPermission } from '../types/auth';

const ProtectedRoute: React.FC<{ permission?: DashboardPermission }> = ({ permission }) => {
  const { isAuthenticated, hasPermission, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/jobs" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
