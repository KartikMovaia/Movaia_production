// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { User, AccountType } from '../types/user.types';
import { LoginRequest, RegisterRequest, ChangePasswordRequest } from '../types/auth.types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isIndividual: boolean;
  isCoach: boolean;
  isLimitedAthlete: boolean;
  isAdmin: boolean;
  canUpload: boolean;
  canManageAthletes: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (err: any) {
      console.error('Failed to load user:', err);
      // Don't set error here as this is just initial load
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      setUser(response.user);

      // Handle password change requirement
      if (response.requirePasswordChange || response.user.requirePasswordChange) {
        navigate('/change-password');
      } else {
        // Navigate based on account type
        switch (response.user.accountType) {
          case AccountType.COACH:
            navigate('/coach');
            break;
          case AccountType.ATHLETE_LIMITED:
            navigate('/athlete');
            break;
          case AccountType.INDIVIDUAL:
            navigate('/dashboard');
            break;
          case AccountType.ADMIN:
            navigate('/admin');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Registering with data:', data);
      await authService.register(data);
      
      // Successful registration - redirect to login with success message
      navigate('/login?registered=true');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error in context:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      navigate('/login');
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.changePassword(data);
      
      // Refresh user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Navigate to appropriate dashboard
      if (userData.accountType === AccountType.COACH) {
        navigate('/coach');
      } else if (userData.accountType === AccountType.ATHLETE_LIMITED) {
        navigate('/athlete');
      } else if (userData.accountType === AccountType.INDIVIDUAL) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Password change failed.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
    }
  };

  const clearError = () => setError(null);

  // Computed properties
  const isAuthenticated = !!user;
  const isIndividual = user?.accountType === AccountType.INDIVIDUAL;
  const isCoach = user?.accountType === AccountType.COACH;
  const isLimitedAthlete = user?.accountType === AccountType.ATHLETE_LIMITED;
  const isAdmin = user?.accountType === AccountType.ADMIN;
  const canUpload = isIndividual || isCoach;
  const canManageAthletes = isCoach;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        changePassword,
        refreshUser,
        clearError,
        isAuthenticated,
        isIndividual,
        isCoach,
        isLimitedAthlete,
        isAdmin,
        canUpload,
        canManageAthletes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};