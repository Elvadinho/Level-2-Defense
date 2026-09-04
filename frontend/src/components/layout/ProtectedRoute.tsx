import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

/**
 * Route protection guard
 * Validates active session token and optional role permissions before rendering children
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show a clean loading indicator while authenticating the session on app launch
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-card border border-[#BBBFBF]/40 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#05AD98]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#878787]">
          Verifying Session...
        </p>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, ensure user possesses one
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
