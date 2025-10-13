// src/services/admin.service.ts

import { apiService } from '../../../../shared/services/api.service';

interface DashboardMetrics {
  users: {
    total: number;
    byPlan: {
      free: number;
      basic: number;
      pro: number;
      coachBasic: number;
      coachPro: number;
      coachUnlimited: number;
    };
    growth: number;
    newThisMonth: number;
  };
  revenue: {
    total: number;
    mrr: number;
    byPlan: {
      basic: number;
      pro: number;
      coachBasic: number;
      coachPro: number;
      coachUnlimited: number;
    };
    growth: number;
    churnRate: number;
  };
  activity: {
    mau: number;
    dau: number;
    monthlyUploads: number;
    totalReports: number;
    avgSessionDuration: number;
    engagementRate: number;
  };
  performance: {
    avgAnalysisTime: number;
    successRate: number;
    serverUptime: number;
    apiLatency: number;
  };
}

interface UserManagementData {
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    subscriptionPlan: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    analysisCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RevenueAnalytics {
  daily: Array<{ date: string; amount: number }>;
  weekly: Array<{ week: string; amount: number }>;
  monthly: Array<{ month: string; amount: number }>;
  projections: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
}

interface SystemHealth {
  services: {
    api: { status: string; latency: number };
    database: { status: string; connections: number };
    storage: { status: string; usage: number };
    analysis: { status: string; queue: number };
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

class AdminService {
  // Dashboard Metrics
  async getDashboardMetrics(dateRange: string = '30d'): Promise<DashboardMetrics> {
    try {
      const response = await apiService.get<DashboardMetrics>(`/admin/dashboard/metrics?range=${dateRange}`);
      return response.data;
    } catch (error) {
      // Return mock data for development
      return this.getMockDashboardMetrics();
    }
  }

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    accountType?: string;
    subscriptionPlan?: string;
    isActive?: boolean;
  }): Promise<UserManagementData> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await apiService.get<UserManagementData>(`/admin/users?${queryParams}`);
    return response.data;
  }

  async updateUser(userId: string, data: Partial<{
    isActive: boolean;
    accountType: string;
    subscriptionPlan: string;
  }>): Promise<void> {
    await apiService.put(`/admin/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<void> {
    await apiService.delete(`/admin/users/${userId}`);
  }

  // Revenue Analytics
  async getRevenueAnalytics(dateRange: string = '30d'): Promise<RevenueAnalytics> {
    const response = await apiService.get<RevenueAnalytics>(`/admin/revenue/analytics?range=${dateRange}`);
    return response.data;
  }

  async exportRevenueReport(format: 'csv' | 'xlsx' = 'csv', dateRange: string = '30d'): Promise<Blob> {
    const response = await apiService.get(`/admin/revenue/export?format=${format}&range=${dateRange}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Activity Tracking
  async getActivityLogs(params: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await apiService.get(`/admin/activity/logs?${queryParams}`);
    return response.data;
  }

  async getEngagementMetrics(dateRange: string = '30d'): Promise<any> {
    const response = await apiService.get(`/admin/activity/engagement?range=${dateRange}`);
    return response.data;
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiService.get<SystemHealth>('/admin/system/health');
    return response.data;
  }

  async getSystemLogs(params: {
    level?: 'info' | 'warning' | 'error';
    service?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await apiService.get(`/admin/system/logs?${queryParams}`);
    return response.data;
  }

  // Subscription Management
  async getSubscriptionMetrics(): Promise<any> {
    const response = await apiService.get('/admin/subscriptions/metrics');
    return response.data;
  }

  async updateSubscriptionPricing(plan: string, price: number): Promise<void> {
    await apiService.put(`/admin/subscriptions/pricing/${plan}`, { price });
  }

  // Analysis Management
  async getAnalysisMetrics(dateRange: string = '30d'): Promise<any> {
    const response = await apiService.get(`/admin/analysis/metrics?range=${dateRange}`);
    return response.data;
  }

  async getFailedAnalyses(page: number = 1, limit: number = 20): Promise<any> {
    const response = await apiService.get(`/admin/analysis/failed?page=${page}&limit=${limit}`);
    return response.data;
  }

  async retryAnalysis(analysisId: string): Promise<void> {
    await apiService.post(`/admin/analysis/${analysisId}/retry`);
  }

  // Export Functions
  async exportUserData(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiService.get(`/admin/export/users?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportAnalyticsReport(
    reportType: 'dashboard' | 'revenue' | 'activity' | 'complete',
    dateRange: string = '30d',
    format: 'csv' | 'xlsx' | 'pdf' = 'csv'
  ): Promise<Blob> {
    const response = await apiService.get(
      `/admin/export/report?type=${reportType}&range=${dateRange}&format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Mock data for development
  private getMockDashboardMetrics(): DashboardMetrics {
    return {
      users: {
        total: 2847,
        byPlan: {
          free: 1523,
          basic: 687,
          pro: 342,
          coachBasic: 189,
          coachPro: 87,
          coachUnlimited: 19
        },
        growth: 12.5,
        newThisMonth: 234
      },
      revenue: {
        total: 487650,
        mrr: 18750,
        byPlan: {
          basic: 6869.31,
          pro: 6838.58,
          coachBasic: 5668.11,
          coachPro: 5133.00,
          coachUnlimited: 1898.81
        },
        growth: 8.3,
        churnRate: 2.1
      },
      activity: {
        mau: 1843,
        dau: 412,
        monthlyUploads: 3421,
        totalReports: 15234,
        avgSessionDuration: 12.4,
        engagementRate: 64.7
      },
      performance: {
        avgAnalysisTime: 4.2,
        successRate: 98.7,
        serverUptime: 99.95,
        apiLatency: 124
      }
    };
  }

  // Notification Management
  async sendNotification(params: {
    userId?: string;
    userGroup?: 'all' | 'free' | 'paid' | 'coaches';
    title: string;
    message: string;
    type: 'info' | 'warning' | 'promotion';
  }): Promise<void> {
    await apiService.post('/admin/notifications/send', params);
  }

  // Platform Settings
  async getPlatformSettings(): Promise<any> {
    const response = await apiService.get('/admin/settings');
    return response.data;
  }

  async updatePlatformSettings(settings: any): Promise<void> {
    await apiService.put('/admin/settings', settings);
  }
}

export const adminService = new AdminService();