import { Router } from 'express';
import {
  // Dashboard & Metrics
  getDashboardMetrics,
  getPlatformStats,
  getRevenueAnalytics,
  getActivityMetrics,
  getSystemHealth,
  
  // User Management
  getAllUsers,
  getUserById,
  updateUser,
  suspendUser,
  deleteUser,
  bulkUpdateUsers,
  
  // Subscription Management
  getSubscriptions,
  updateSubscription,
  cancelSubscription,
  getSubscriptionMetrics,
  updatePricing,
  
  // Analysis Management
  getAllAnalyses,
  getAnalysisMetrics,
  getFailedAnalyses,
  retryAnalysis,
  deleteAnalysis,
  
  // Activity & Logs
  getActivityLogs,
  getSystemLogs,
  getAuditTrail,
  
  // Notifications
  sendNotification,
  sendBulkNotification,
  getNotificationHistory,
  
  // Settings & Configuration
  getPlatformSettings,
  updatePlatformSettings,
  getMaintenanceMode,
  setMaintenanceMode,
  
  // Export & Reports
  exportUserData,
  exportAnalyticsReport,
  exportRevenueReport,
  generateCustomReport,
  
  // Revenue & Billing
  getPaymentHistory,
  getRevenueByPeriod,
  getChurnMetrics,
  getLifetimeValue,
} from '../controllers/admin.controller';
import { authenticate, requireAccountType } from '../../../shared/middleware/auth.middleware';
import { AccountType } from '@prisma/client';

const router = Router();

// All admin routes require authentication and ADMIN account type
router.use(authenticate);
router.use(requireAccountType(AccountType.ADMIN));

// Dashboard & Metrics
router.get('/dashboard/metrics', getDashboardMetrics);
router.get('/dashboard/stats', getPlatformStats);
router.get('/revenue/analytics', getRevenueAnalytics);
router.get('/activity/metrics', getActivityMetrics);
router.get('/system/health', getSystemHealth);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.post('/users/:userId/suspend', suspendUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/bulk-update', bulkUpdateUsers);

// Subscription Management
router.get('/subscriptions', getSubscriptions);
router.get('/subscriptions/metrics', getSubscriptionMetrics);
router.put('/subscriptions/:subscriptionId', updateSubscription);
router.post('/subscriptions/:subscriptionId/cancel', cancelSubscription);
router.put('/subscriptions/pricing/:plan', updatePricing);

// Analysis Management
router.get('/analyses', getAllAnalyses);
router.get('/analyses/metrics', getAnalysisMetrics);
router.get('/analyses/failed', getFailedAnalyses);
router.post('/analyses/:analysisId/retry', retryAnalysis);
router.delete('/analyses/:analysisId', deleteAnalysis);

// Activity & Logs
router.get('/activity/logs', getActivityLogs);
router.get('/system/logs', getSystemLogs);
router.get('/audit/trail', getAuditTrail);

// Notifications
router.post('/notifications/send', sendNotification);
router.post('/notifications/bulk', sendBulkNotification);
router.get('/notifications/history', getNotificationHistory);

// Settings & Configuration
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);
router.get('/maintenance', getMaintenanceMode);
router.post('/maintenance', setMaintenanceMode);

// Export & Reports
router.get('/export/users', exportUserData);
router.get('/export/analytics', exportAnalyticsReport);
router.get('/export/revenue', exportRevenueReport);
router.post('/export/custom', generateCustomReport);

// Revenue & Billing
router.get('/payments/history', getPaymentHistory);
router.get('/revenue/period', getRevenueByPeriod);
router.get('/revenue/churn', getChurnMetrics);
router.get('/revenue/ltv', getLifetimeValue);

export default router;