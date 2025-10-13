// src/components/common/HomeRedirect.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccountType } from '../types/user.types';
import LoadingSpinner from './LoadingSpinner';

const HomeRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-[#686868] mb-4">
            Welcome to <span className="text-[#ABD037]">Movaia</span>
          </h1>
          <p className="text-xl text-[#686868] mb-8">
            AI-Powered Running Form Analysis Platform
          </p>
          <div className="space-x-4">
            <a
              href="/register"
              className="inline-block bg-[#ABD037] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#98B830] transition-colors"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="inline-block border border-[#ABD037] text-[#ABD037] px-8 py-3 rounded-lg font-medium hover:bg-[#ABD037] hover:bg-opacity-10 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard based on account type
  switch (user.accountType) {
    case AccountType.COACH:
    case 'COACH':
      return <Navigate to="/coach" replace />;
    case AccountType.ATHLETE_LIMITED:
    case 'ATHLETE_LIMITED':
      return <Navigate to="/athlete" replace />;
    case AccountType.INDIVIDUAL:
    case 'INDIVIDUAL':
      return <Navigate to="/dashboard" replace />;
    case AccountType.ADMIN:
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default HomeRedirect;