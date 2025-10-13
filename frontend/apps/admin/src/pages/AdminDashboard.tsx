import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../../../shared/contexts/AuthContext';
import { adminService } from '../services/admin.service';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface User {
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
  athleteCount?: number;
}

const AdminDashboard: React.FC = () => {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  // const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'revenue' | 'activity' | 'system' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [showUserModal, setShowUserModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notification, setNotification] = useState({ title: '', message: '', userGroup: 'all' });

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
    } else if (activeSection === 'activity') {
      loadActivityLogs();
    } else if (activeSection === 'system') {
      loadSystemHealth();
    }
  }, [activeSection, currentPage, searchQuery]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardMetrics(dateRange);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers({
        page: currentPage,
        limit: 10,
        search: searchQuery
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const data = await adminService.getActivityLogs({
        page: currentPage,
        limit: 20
      });
      setActivityLogs(data.logs);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const data = await adminService.getSystemHealth();
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          return;
        }
        await adminService.deleteUser(userId);
      } else {
        await adminService.updateUser(userId, { isActive: action === 'activate' });
      }
      loadUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const handleSendNotification = async () => {
    try {
      await adminService.sendNotification({
        userGroup: notification.userGroup as any,
        title: notification.title,
        message: notification.message,
        type: 'info'
      });
      setShowNotificationModal(false);
      setNotification({ title: '', message: '', userGroup: 'all' });
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const exportData = async (type: 'users' | 'analytics' | 'revenue') => {
    try {
      let blob;
      if (type === 'users') {
        blob = await adminService.exportUserData();
      } else if (type === 'analytics') {
        blob = await adminService.exportAnalyticsReport('dashboard', dateRange);
      } else {
        blob = await adminService.exportRevenueReport('csv',dateRange);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold text-neutral-900">
                Admin Dashboard
              </h1>
              <p className="text-lg text-neutral-600 mt-2">
                Complete platform control center
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-modern"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={() => loadDashboardData()}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 mb-8">
          <div className="border-b border-neutral-100">
            <nav className="flex -mb-px">
              {(['overview', 'users', 'revenue', 'activity', 'system', 'settings'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-6 py-4 text-sm font-medium capitalize transition-colors ${
                    activeSection === section
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {section === 'system' ? 'System Health' : section}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Section */}
            {activeSection === 'overview' && metrics && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card-luxury hover-lift">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${metrics.users.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.users.growth > 0 ? '+' : ''}{metrics.users.growth}%
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">Total Users</p>
                    <p className="text-2xl font-bold text-neutral-900">{metrics.users.total.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-2">+{metrics.users.newThisMonth} this month</p>
                  </div>

                  <div className="card-luxury hover-lift">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${metrics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth}%
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-neutral-900">${metrics.revenue.mrr.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-2">Churn: {metrics.revenue.churnRate}%</p>
                  </div>

                  <div className="card-luxury hover-lift">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-blue-600">
                        {((metrics.activity.mau / metrics.users.total) * 100).toFixed(1)}% active
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">Monthly Active Users</p>
                    <p className="text-2xl font-bold text-neutral-900">{metrics.activity.mau.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-2">DAU: {metrics.activity.dau}</p>
                  </div>

                  <div className="card-luxury hover-lift">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-purple-600">
                        Success: {metrics.performance.successRate}%
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">Total Reports</p>
                    <p className="text-2xl font-bold text-neutral-900">{metrics.activity.totalReports.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-2">Uploads: {metrics.activity.monthlyUploads}/mo</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="btn-secondary text-sm"
                    >
                      Send Notification
                    </button>
                    <button
                      onClick={() => exportData('users')}
                      className="btn-secondary text-sm"
                    >
                      Export Users
                    </button>
                    <button
                      onClick={() => exportData('revenue')}
                      className="btn-secondary text-sm"
                    >
                      Export Revenue
                    </button>
                    <button
                      onClick={() => setActiveSection('system')}
                      className="btn-secondary text-sm"
                    >
                      Check System
                    </button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                    <p className="text-sm text-green-700 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-green-900">{metrics.performance.successRate}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <p className="text-sm text-blue-700 font-medium">Avg Analysis Time</p>
                    <p className="text-2xl font-bold text-blue-900">{metrics.performance.avgAnalysisTime}s</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-700 font-medium">Server Uptime</p>
                    <p className="text-2xl font-bold text-purple-900">{metrics.performance.serverUptime}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-700 font-medium">API Latency</p>
                    <p className="text-2xl font-bold text-amber-900">{metrics.performance.apiLatency}ms</p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management Section */}
            {activeSection === 'users' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-modern w-64"
                    />
                    <select className="input-modern">
                      <option value="">All Types</option>
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="COACH">Coach</option>
                      <option value="ATHLETE_LIMITED">Athlete</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={() => exportData('users')}
                    className="btn-secondary"
                  >
                    Export Users
                  </button>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Analyses</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-neutral-900">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-neutral-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700">
                              {user.accountType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {user.subscriptionPlan}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {user.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {user.analysisCount}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => console.log('View user:', user)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, user.isActive ? 'suspend' : 'activate')}
                                className={`text-sm ${
                                  user.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'
                                }`}
                              >
                                {user.isActive ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, 'delete')}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Section */}
            {activeSection === 'revenue' && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <p className="text-sm text-green-700 font-medium mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-900">${metrics.revenue.total.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-2">Lifetime value</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <p className="text-sm text-blue-700 font-medium mb-2">MRR</p>
                    <p className="text-3xl font-bold text-blue-900">${metrics.revenue.mrr.toLocaleString()}</p>
                    <p className="text-sm text-blue-600 mt-2">Monthly recurring</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <p className="text-sm text-purple-700 font-medium mb-2">ARR</p>
                    <p className="text-3xl font-bold text-purple-900">${(metrics.revenue.mrr * 12).toLocaleString()}</p>
                    <p className="text-sm text-purple-600 mt-2">Annual recurring</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue by Plan</h3>
                  <div className="space-y-3">
                    {Object.entries(metrics.revenue.byPlan).map(([plan, amount]) => (
                      <div key={plan} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                        <span className="font-medium text-neutral-700 capitalize">
                          {plan.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-bold text-neutral-900">${(amount as number).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => exportData('revenue')}
                  className="btn-luxury w-full"
                >
                  Export Revenue Report
                </button>
              </div>
            )}

            {/* Activity Logs Section */}
            {activeSection === 'activity' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {activityLogs.map((log, index) => (
                      <div key={index} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{log.action}</p>
                            <p className="text-sm text-neutral-500">
                              {log.user?.email} • {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {log.metadata && (
                            <span className="text-xs text-neutral-400">
                              {JSON.stringify(log.metadata).substring(0, 50)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => exportData('analytics')}
                  className="btn-secondary w-full"
                >
                  Export Activity Report
                </button>
              </div>
            )}

            {/* System Health Section */}
            {activeSection === 'system' && systemHealth && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(systemHealth.services).map(([service, data]: [string, any]) => (
                    <div key={service} className="bg-white rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-neutral-900 capitalize">{service}</p>
                        <span className={`w-3 h-3 rounded-full ${
                          data.status === 'healthy' ? 'bg-green-500' : 
                          data.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <p className="text-sm text-neutral-600">Status: {data.status}</p>
                      {data.latency && <p className="text-sm text-neutral-600">Latency: {data.latency}ms</p>}
                      {data.queue !== undefined && <p className="text-sm text-neutral-600">Queue: {data.queue}</p>}
                      {data.usage !== undefined && <p className="text-sm text-neutral-600">Usage: {data.usage}%</p>}
                    </div>
                  ))}
                </div>

                {systemHealth.alerts && systemHealth.alerts.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">System Alerts</h4>
                    {systemHealth.alerts.map((alert: any, index: number) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Platform Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">Maintenance Mode</p>
                        <p className="text-sm text-neutral-500">Temporarily disable user access</p>
                      </div>
                      <button className="btn-secondary">Disable</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">Registration</p>
                        <p className="text-sm text-neutral-500">Allow new user signups</p>
                      </div>
                      <button className="btn-secondary">Enabled</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">Max Upload Size</p>
                        <p className="text-sm text-neutral-500">Maximum video file size</p>
                      </div>
                      <input type="text" defaultValue="500 MB" className="input-modern w-32" />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2">Danger Zone</h4>
                  <p className="text-sm text-amber-700 mb-4">
                    These actions are irreversible. Please be certain.
                  </p>
                  <div className="flex items-center space-x-4">
                    <button className="btn-secondary text-red-600 border-red-600 hover:bg-red-50">
                      Clear Cache
                    </button>
                    <button className="btn-secondary text-red-600 border-red-600 hover:bg-red-50">
                      Reset Database
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Send Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">User Group</label>
                  <select
                    value={notification.userGroup}
                    onChange={(e) => setNotification({...notification, userGroup: e.target.value})}
                    className="input-modern w-full"
                  >
                    <option value="all">All Users</option>
                    <option value="free">Free Users</option>
                    <option value="paid">Paid Users</option>
                    <option value="coaches">Coaches</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={notification.title}
                    onChange={(e) => setNotification({...notification, title: e.target.value})}
                    className="input-modern w-full"
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                  <textarea
                    value={notification.message}
                    onChange={(e) => setNotification({...notification, message: e.target.value})}
                    className="input-modern w-full h-32"
                    placeholder="Notification message"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotification}
                  className="btn-luxury"
                >
                  Send Notification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;