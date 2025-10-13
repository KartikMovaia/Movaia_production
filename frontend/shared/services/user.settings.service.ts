// frontend/src/services/userSettings.service.ts

import { apiService } from './api.service';

export interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  runningExperience?: string;
  weeklyMileage?: number;
  preferredDistance?: string;
  primaryGoal?: string;
  injuryHistory?: any[];
  gender?: string;
  unitPreference?: string;
  personalBest?: any;
}

export interface NotificationPreferences {
  emailAnalysis: boolean;
  emailMarketing: boolean;
  pushAnalysis: boolean;
  pushUpdates: boolean;
  smsAlerts: boolean;
}

export interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  subscriptionPlan: string;
}

export interface SubscriptionUpgrade {
  plan: string;
  paymentMethod?: string;
}

class UserSettingsService {
  // Profile Management
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiService.put('/user/profile', data);
    return response.data.profile;
  }

  async uploadProfileImage(file: File): Promise<{ profileImageUrl: string }> {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await apiService.post('/user/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async deleteProfileImage(): Promise<void> {
    await apiService.delete('/user/profile/image');
  }

  // Subscription Management
  async getCurrentSubscription(): Promise<any> {
    const response = await apiService.get('/user/subscription');
    return response.data.subscription;
  }

  async getAvailablePlans(): Promise<any[]> {
    const response = await apiService.get('/subscriptions/plans');
    return response.data.plans;
  }

  async upgradeSubscription(data: SubscriptionUpgrade): Promise<any> {
    const response = await apiService.post('/user/subscription/upgrade', data);
    return response.data;
  }

  async downgradeSubscription(plan: string): Promise<any> {
    const response = await apiService.post('/user/subscription/downgrade', { plan });
    return response.data;
  }

  async cancelSubscription(reason?: string): Promise<void> {
    await apiService.post('/user/subscription/cancel', { reason });
  }

  async reactivateSubscription(): Promise<any> {
    const response = await apiService.post('/user/subscription/reactivate');
    return response.data;
  }

  // Billing Management
  async getBillingHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ payments: BillingHistory[]; total: number }> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await apiService.get(`/user/billing/history?${queryParams}`);
    return response.data;
  }

  async getPaymentMethods(): Promise<any[]> {
    const response = await apiService.get('/user/payment-methods');
    return response.data.paymentMethods;
  }

  async addPaymentMethod(paymentMethodId: string): Promise<any> {
    const response = await apiService.post('/user/payment-methods', { paymentMethodId });
    return response.data;
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiService.delete(`/user/payment-methods/${paymentMethodId}`);
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await apiService.put(`/user/payment-methods/${paymentMethodId}/default`);
  }

  async downloadInvoice(paymentId: string): Promise<Blob> {
    const response = await apiService.get(`/user/invoices/${paymentId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Security Settings
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiService.post('/user/security/2fa/enable');
    return response.data;
  }

  async verify2FA(code: string): Promise<{ backupCodes: string[] }> {
    const response = await apiService.post('/user/security/2fa/verify', { code });
    return response.data;
  }

  async disable2FA(code: string): Promise<void> {
    await apiService.post('/user/security/2fa/disable', { code });
  }

  async getSessions(): Promise<any[]> {
    const response = await apiService.get('/user/security/sessions');
    return response.data.sessions;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await apiService.delete(`/user/security/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    await apiService.post('/user/security/sessions/revoke-all');
  }

  // Notification Preferences
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await apiService.get('/user/notifications/preferences');
    return response.data.preferences;
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    await apiService.put('/user/notifications/preferences', preferences);
  }

  async getNotificationHistory(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await apiService.get(`/user/notifications/history?${queryParams}`);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await apiService.put(`/user/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await apiService.post('/user/notifications/read-all');
  }

  // Account Management
  async exportUserData(): Promise<Blob> {
    const response = await apiService.get('/user/export-data', {
      responseType: 'blob'
    });
    return response.data;
  }

  async deleteAccount(password: string, reason?: string): Promise<void> {
    await apiService.delete('/user/account', {
      data: { password, reason }
    });
  }

  async requestAccountRecovery(email: string): Promise<void> {
    await apiService.post('/auth/recover', { email });
  }

  // Coach-specific methods
  async getCoachSettings(): Promise<any> {
    const response = await apiService.get('/coach/settings');
    return response.data.settings;
  }

  async updateCoachSettings(settings: any): Promise<void> {
    await apiService.put('/coach/settings', settings);
  }

  async getAthleteLimit(): Promise<{ current: number; limit: number; canAdd: boolean }> {
    const response = await apiService.get('/coach/athlete-limit');
    return response.data;
  }

  // Admin-specific methods
  async getAdminSettings(): Promise<any> {
    const response = await apiService.get('/admin/settings');
    return response.data.settings;
  }

  async updateAdminSettings(settings: any): Promise<void> {
    await apiService.put('/admin/settings', settings);
  }

  async getPlatformMetrics(): Promise<any> {
    const response = await apiService.get('/admin/platform/metrics');
    return response.data;
  }

  // Athlete-specific methods
  async getCoachInfo(): Promise<any> {
    const response = await apiService.get('/athlete/coach');
    return response.data.coach;
  }

  async requestUpgrade(): Promise<any> {
    const response = await apiService.post('/athlete/request-upgrade');
    return response.data;
  }

  async disconnectFromCoach(): Promise<void> {
    await apiService.post('/athlete/disconnect-coach');
  }
}

export const userSettingsService = new UserSettingsService();