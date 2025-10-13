// src/components/common/ProtectedRoute.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccountType } from '../types/user.types';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedAccountTypes?: AccountType[];
  requirePasswordChange?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedAccountTypes,
  requirePasswordChange = false,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if password change is required
  if (user?.requirePasswordChange && !requirePasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Check if user has the required account type
  if (allowedAccountTypes && user && !allowedAccountTypes.includes(user.accountType)) {
    // Redirect to appropriate dashboard based on account type
    switch (user.accountType) {
      case AccountType.COACH:
        return <Navigate to="/coach" replace />;
      case AccountType.ATHLETE_LIMITED:
        return <Navigate to="/athlete" replace />;
      case AccountType.INDIVIDUAL:
        return <Navigate to="/dashboard" replace />;
      case AccountType.ADMIN:
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;