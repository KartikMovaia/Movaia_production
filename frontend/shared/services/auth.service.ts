// src/services/auth.service.ts

import { apiService } from './api.service';
import { tokenService } from './token.service';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
} from '../types/auth.types';
import { User } from '../types/user.types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post('/auth/login', credentials);
      const { user, tokens, message } = response.data;
      
      tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      
      return {
        user,
        tokens,
        message,
        requirePasswordChange: user.mustChangePassword
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<{ message: string }> {
    try {
      // Send ALL data including runningProfile
      const requestBody = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        accountType: data.accountType,
        runningProfile: data.runningProfile  // ✅ Include the onboarding data
      };
      
      console.log('Sending to backend:', requestBody); // Debug log
      
      const response = await apiService.post('/auth/register', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        await apiService.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenService.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
  try {
    const response = await apiService.get('/auth/me');
    const userData = response.data.user;
    
    // Flatten the runningProfile data into the user object
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      accountType: userData.accountType,
      profileImage: userData.profileImage,
      isEmailVerified: userData.isEmailVerified,
      isUpgraded: userData.isUpgraded,
      mustChangePassword: userData.mustChangePassword,
      requirePasswordChange: userData.mustChangePassword,
      createdByCoach: userData.createdByCoach,
      subscription: userData.subscription,
      managedAthletes: userData.managedAthletes,
      stats: userData.stats,
      
      // Flatten runningProfile fields
      primaryGoal: userData.runningProfile?.primaryGoal || userData.primaryGoal,
      injuryHistory: userData.runningProfile?.injuryHistory || userData.injuryHistory,
      preferredDistance: userData.runningProfile?.preferredDistance || userData.preferredDistance,
      unitPreference: userData.runningProfile?.unitPreference || userData.unitPreference,
      gender: userData.runningProfile?.gender || userData.gender,
      height: userData.runningProfile?.height || userData.height,
      weight: userData.runningProfile?.weight || userData.weight,
      dateOfBirth: userData.runningProfile?.dateOfBirth || userData.dateOfBirth,
      personalBest: userData.runningProfile?.personalBest || userData.personalBest,
      runningExperience: userData.runningProfile?.runningExperience || userData.runningExperience,
      weeklyMileage: userData.runningProfile?.weeklyMileage || userData.weeklyMileage,
    };
  } catch (error: any) {
    console.error('Get current user error:', error.response?.data || error);
    throw error;
  }
}

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiService.post('/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      console.error('Change password error:', error.response?.data || error);
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post('/auth/refresh', {
        refreshToken,
      });

      const { tokens } = response.data;
      tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data || error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return tokenService.isAuthenticated();
  }
}

export const authService = new AuthService();