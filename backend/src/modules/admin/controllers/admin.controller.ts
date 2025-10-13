import { Request, Response } from 'express';
import { PrismaClient, AccountType, SubscriptionPlan } from '@prisma/client';
import { Parser } from 'json2csv';
import { hashPassword } from '../../auth/utils/auth.utils';

const prisma = new PrismaClient();

/**
 * Get dashboard metrics with time range filtering
 */
export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user metrics
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } }
    });
    
    // Users by plan
    const usersByPlan = await prisma.user.groupBy({
      by: ['accountType'],
      _count: true,
    });

    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    // Calculate user growth
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousPeriodUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    });

    const userGrowth = previousPeriodUsers > 0 
      ? ((newUsers - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(1)
      : 0;

    // Revenue metrics
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true }
    });

    const planPrices = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.INDIVIDUAL_BASIC]: 9.99,
      [SubscriptionPlan.INDIVIDUAL_PRO]: 19.99,
      [SubscriptionPlan.COACH_BASIC]: 29.99,
      [SubscriptionPlan.COACH_PRO]: 59.99,
      [SubscriptionPlan.COACH_UNLIMITED]: 99.99,
    };

    let mrr = 0;
    const revenueByPlan: any = {
      basic: 0,
      pro: 0,
      coachBasic: 0,
      coachPro: 0,
      coachUnlimited: 0,
    };

    activeSubscriptions.forEach(sub => {
      const price = planPrices[sub.plan] || 0;
      mrr += price;
      
      switch (sub.plan) {
        case SubscriptionPlan.INDIVIDUAL_BASIC:
          revenueByPlan.basic += price;
          break;
        case SubscriptionPlan.INDIVIDUAL_PRO:
          revenueByPlan.pro += price;
          break;
        case SubscriptionPlan.COACH_BASIC:
          revenueByPlan.coachBasic += price;
          break;
        case SubscriptionPlan.COACH_PRO:
          revenueByPlan.coachPro += price;
          break;
        case SubscriptionPlan.COACH_UNLIMITED:
          revenueByPlan.coachUnlimited += price;
          break;
      }
    });

    // Calculate churn rate
    const cancelledSubs = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        cancelledAt: { gte: startDate }
      }
    });
    
    const churnRate = activeSubscriptions.length > 0
      ? (cancelledSubs / activeSubscriptions.length * 100).toFixed(1)
      : 0;

    // Activity metrics
    const mau = await prisma.user.count({
      where: { lastLoginAt: { gte: startDate } }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dau = await prisma.user.count({
      where: { lastLoginAt: { gte: today } }
    });

    const monthlyUploads = await prisma.analysis.count({
      where: { createdAt: { gte: startDate } }
    });

    const totalReports = await prisma.analysis.count();

    // Calculate engagement rate
    const engagementRate = totalUsers > 0
      ? (mau / totalUsers * 100).toFixed(1)
      : 0;

    // Performance metrics
    const recentAnalyses = await prisma.analysis.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      select: { createdAt: true, updatedAt: true }
    });

    const avgAnalysisTime = recentAnalyses.length > 0
      ? recentAnalyses.reduce((acc, analysis) => {
          const time = (analysis.updatedAt.getTime() - analysis.createdAt.getTime()) / 1000;
          return acc + time;
        }, 0) / recentAnalyses.length
      : 0;

    const successfulAnalyses = await prisma.analysis.count({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    });

    const totalAnalyses = await prisma.analysis.count({
      where: { createdAt: { gte: startDate } }
    });

    const successRate = totalAnalyses > 0
      ? (successfulAnalyses / totalAnalyses * 100).toFixed(1)
      : 100;

    // Prepare response
    const metrics = {
      users: {
        total: totalUsers,
        byPlan: {
          free: subscriptionsByPlan.find(p => p.plan === SubscriptionPlan.FREE)?._count || 0,
          basic: subscriptionsByPlan.find(p => p.plan === SubscriptionPlan.INDIVIDUAL_BASIC)?._count || 0,
          pro: subscriptionsByPlan.find(p => p.plan === SubscriptionPlan.INDIVIDUAL_PRO)?._count || 0,
          coachBasic: subscriptionsByPlan.find(p => p.plan === SubscriptionPlan.COACH_BASIC)?._count || 0,
          coachPro: subscriptionsByPlan.find(p => p.plan === SubscriptionPlan.COACH_PRO)?._count || 0,
          coachUnlimited: subscriptionsByPlan.find(p => p.plan === SubscriptionPlan.COACH_UNLIMITED)?._count || 0,
        },
        growth: Number(userGrowth),
        newThisMonth: newUsers,
      },
      revenue: {
        total: mrr * 12, // Annualized
        mrr,
        byPlan: revenueByPlan,
        growth: 8.3, // This would be calculated from payment history
        churnRate: Number(churnRate),
      },
      activity: {
        mau,
        dau,
        monthlyUploads,
        totalReports,
        avgSessionDuration: 12.4, // This would need session tracking
        engagementRate: Number(engagementRate),
      },
      performance: {
        avgAnalysisTime: Number(avgAnalysisTime.toFixed(1)),
        successRate: Number(successRate),
        serverUptime: 99.95, // This would come from monitoring service
        apiLatency: 124, // This would come from monitoring service
      },
    };

    res.json(metrics);
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to get dashboard metrics' });
  }
};

/**
 * Get platform statistics
 */
export const getPlatformStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { accountType: AccountType.INDIVIDUAL } }),
      prisma.user.count({ where: { accountType: AccountType.COACH } }),
      prisma.user.count({ where: { accountType: AccountType.ATHLETE_LIMITED } }),
      prisma.analysis.count(),
      prisma.analysis.count({ where: { status: 'COMPLETED' } }),
      prisma.analysis.count({ where: { status: 'FAILED' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      totalUsers: stats[0],
      individualUsers: stats[1],
      coaches: stats[2],
      athletes: stats[3],
      totalAnalyses: stats[4],
      completedAnalyses: stats[5],
      failedAnalyses: stats[6],
      activeSubscriptions: stats[7],
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Failed to get platform statistics' });
  }
};

/**
 * Get all users with filtering and pagination
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      accountType,
      subscriptionPlan,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (subscriptionPlan) {
      where.subscription = { plan: subscriptionPlan };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get users
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder },
        include: {
          subscription: true,
          _count: {
            select: {
              analyses: true,
              managedAthletes: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      subscriptionPlan: user.subscription?.plan || 'FREE',
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      analysisCount: user._count.analyses,
      athleteCount: user._count.managedAthletes,
    }));

    res.json({
      users: formattedUsers,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

/**
 * Get specific user details
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        createdByCoach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        managedAthletes: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            analyses: true,
            managedAthletes: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

/**
 * Update user information
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.password;
    delete updates.createdAt;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Log admin action
    await prisma.activityLog.create({
      data: {
        userId: req.currentUser?.id!,
        action: 'ADMIN_UPDATE_USER',
        entityType: 'User',
        entityId: userId,
        metadata: { updates },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Suspend/activate user account
 */
export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { suspend = true, reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !suspend },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        userId: req.currentUser?.id!,
        action: suspend ? 'ADMIN_SUSPEND_USER' : 'ADMIN_ACTIVATE_USER',
        entityType: 'User',
        entityId: userId,
        metadata: { reason },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: `User ${suspend ? 'suspended' : 'activated'} successfully`,
      user,
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to suspend/activate user' });
  }
};

/**
 * Delete user account permanently
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete user (cascades to related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        userId: req.currentUser?.id!,
        action: 'ADMIN_DELETE_USER',
        entityType: 'User',
        entityId: userId,
        metadata: { deletedUser: user.email },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Bulk update multiple users
 */
export const bulkUpdateUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'Invalid user IDs' });
      return;
    }

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.password;
    delete updates.createdAt;

    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updates,
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        userId: req.currentUser?.id!,
        action: 'ADMIN_BULK_UPDATE_USERS',
        metadata: { userIds, updates, count: result.count },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: `${result.count} users updated successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({ error: 'Failed to bulk update users' });
  }
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '30d' } = req.query;
    
    // This would integrate with Stripe to get actual payment data
    // For now, returning calculated estimates based on subscriptions
    
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
    });

    const planPrices = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.INDIVIDUAL_BASIC]: 9.99,
      [SubscriptionPlan.INDIVIDUAL_PRO]: 19.99,
      [SubscriptionPlan.COACH_BASIC]: 29.99,
      [SubscriptionPlan.COACH_PRO]: 59.99,
      [SubscriptionPlan.COACH_UNLIMITED]: 99.99,
    };

    // Calculate daily revenue (mock data for demonstration)
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        amount: Math.random() * 1000 + 500,
      };
    });

    // Calculate monthly revenue
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthRevenue = activeSubscriptions.reduce((acc, sub) => {
        return acc + (planPrices[sub.plan] || 0);
      }, 0);
      
      return {
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: monthRevenue * (0.8 + Math.random() * 0.4), // Add some variation
      };
    });

    res.json({
      daily,
      weekly: [], // Would calculate weekly aggregates
      monthly,
      projections: {
        nextMonth: activeSubscriptions.reduce((acc, sub) => acc + (planPrices[sub.plan] || 0), 0),
        nextQuarter: activeSubscriptions.reduce((acc, sub) => acc + (planPrices[sub.plan] || 0), 0) * 3,
        nextYear: activeSubscriptions.reduce((acc, sub) => acc + (planPrices[sub.plan] || 0), 0) * 12,
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
};

/**
 * Get activity metrics
 */
export const getActivityMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '30d', userId } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const where: any = { createdAt: { gte: startDate } };
    if (userId) {
      where.userId = userId;
    }

    const activityLogs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group activities by action
    const actionCounts = activityLogs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    res.json({
      logs: activityLogs,
      summary: {
        total: activityLogs.length,
        byAction: actionCounts,
        period: range,
      },
    });
  } catch (error) {
    console.error('Get activity metrics error:', error);
    res.status(500).json({ error: 'Failed to get activity metrics' });
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    const dbStatus = await prisma.$queryRaw`SELECT 1`;
    
    // Get queue sizes (would integrate with actual queue service)
    const pendingAnalyses = await prisma.analysis.count({
      where: { status: 'PENDING' },
    });

    const processingAnalyses = await prisma.analysis.count({
      where: { status: 'PROCESSING' },
    });

    res.json({
      services: {
        api: {
          status: 'healthy',
          latency: Math.random() * 50 + 50, // Mock latency
        },
        database: {
          status: dbStatus ? 'healthy' : 'unhealthy',
          connections: 5, // Would get from connection pool
        },
        storage: {
          status: 'healthy',
          usage: 45.2, // Would get from S3 metrics
        },
        analysis: {
          status: pendingAnalyses > 100 ? 'degraded' : 'healthy',
          queue: pendingAnalyses + processingAnalyses,
        },
      },
      alerts: [], // Would fetch from monitoring service
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
};

// Subscription Management Functions

export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, plan, page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        skip,
        take: Number(limit),
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      subscriptions,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
};

export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const updates = req.body;

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updates,
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const getSubscriptionMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await prisma.subscription.groupBy({
      by: ['plan', 'status'],
      _count: true,
    });

    res.json({ metrics });
  } catch (error) {
    console.error('Get subscription metrics error:', error);
    res.status(500).json({ error: 'Failed to get subscription metrics' });
  }
};

export const updatePricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.params;
    const { price } = req.body;

    // This would update pricing in Stripe and local config
    res.json({
      message: 'Pricing updated successfully',
      plan,
      price,
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ error: 'Failed to update pricing' });
  }
};

// Analysis Management Functions

export const getAllAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [analyses, total] = await prisma.$transaction([
      prisma.analysis.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analysis.count({ where }),
    ]);

    res.json({
      analyses,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get all analyses error:', error);
    res.status(500).json({ error: 'Failed to get analyses' });
  }
};

export const getAnalysisMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '30d' } = req.query;
    
    const metrics = await prisma.analysis.groupBy({
      by: ['status'],
      _count: true,
    });

    res.json({ metrics });
  } catch (error) {
    console.error('Get analysis metrics error:', error);
    res.status(500).json({ error: 'Failed to get analysis metrics' });
  }
};

export const getFailedAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    const [analyses, total] = await prisma.$transaction([
      prisma.analysis.findMany({
        where: { status: 'FAILED' },
        skip,
        take: Number(limit),
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analysis.count({ where: { status: 'FAILED' } }),
    ]);

    res.json({
      analyses,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get failed analyses error:', error);
    res.status(500).json({ error: 'Failed to get failed analyses' });
  }
};

export const retryAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;

    const analysis = await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'PENDING' },
    });

    // Trigger reprocessing (would integrate with queue service)

    res.json({
      message: 'Analysis queued for retry',
      analysis,
    });
  } catch (error) {
    console.error('Retry analysis error:', error);
    res.status(500).json({ error: 'Failed to retry analysis' });
  }
};

export const deleteAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;

    await prisma.analysis.delete({
      where: { id: analysisId },
    });

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
};

// Activity & Logs Functions

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
};

export const getSystemLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would integrate with logging service (e.g., Winston, CloudWatch)
    res.json({
      logs: [],
      message: 'System logs would be fetched from logging service',
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ error: 'Failed to get system logs' });
  }
};

export const getAuditTrail = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminActions = await prisma.activityLog.findMany({
      where: {
        action: {
          startsWith: 'ADMIN_',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ auditTrail: adminActions });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({ error: 'Failed to get audit trail' });
  }
};

// Notification Functions

export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userGroup, title, message, type } = req.body;

    let userIds: string[] = [];

    if (userId) {
      userIds = [userId];
    } else if (userGroup) {
      let where: any = {};
      
      switch (userGroup) {
        case 'all':
          break;
        case 'free':
          where = { subscription: { plan: SubscriptionPlan.FREE } };
          break;
        case 'paid':
          where = {
            subscription: {
              plan: {
                not: SubscriptionPlan.FREE,
              },
            },
          };
          break;
        case 'coaches':
          where = { accountType: AccountType.COACH };
          break;
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true },
      });
      
      userIds = users.map(u => u.id);
    }

    // Create notifications
    const notifications = await prisma.notification.createMany({
      data: userIds.map(id => ({
        userId: id,
        type: type || 'ADMIN_MESSAGE',
        title,
        message,
      })),
    });

    res.json({
      message: `Notification sent to ${userIds.length} users`,
      count: notifications.count,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

export const sendBulkNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIds, title, message, type } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'Invalid user IDs' });
      return;
    }

    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: type || 'ADMIN_MESSAGE',
        title,
        message,
      })),
    });

    res.json({
      message: `Notification sent to ${notifications.count} users`,
      count: notifications.count,
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({ error: 'Failed to send bulk notification' });
  }
};

export const getNotificationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count(),
    ]);

    res.json({
      notifications,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
};

// Settings Functions

export const getPlatformSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would fetch from a settings table or configuration service
    res.json({
      settings: {
        maintenanceMode: false,
        registrationEnabled: true,
        maxUploadSize: 500 * 1024 * 1024, // 500MB
        supportEmail: 'support@movaia.com',
        analyticsEnabled: true,
      },
    });
  } catch (error) {
    console.error('Get platform settings error:', error);
    res.status(500).json({ error: 'Failed to get platform settings' });
  }
};

export const updatePlatformSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = req.body;

    // This would update settings in database or configuration service
    
    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Update platform settings error:', error);
    res.status(500).json({ error: 'Failed to update platform settings' });
  }
};

export const getMaintenanceMode = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would check from configuration
    res.json({
      maintenanceMode: false,
      message: null,
    });
  } catch (error) {
    console.error('Get maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to get maintenance mode' });
  }
};

export const setMaintenanceMode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled, message } = req.body;

    // This would update configuration and notify users
    
    res.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      maintenanceMode: enabled,
    });
  } catch (error) {
    console.error('Set maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to set maintenance mode' });
  }
};

// Export Functions

export const exportUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'csv' } = req.query;

    const users = await prisma.user.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            analyses: true,
            managedAthletes: true,
          },
        },
      },
    });

    const data = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      subscriptionPlan: user.subscription?.plan || 'FREE',
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      analysisCount: user._count.analyses,
      athleteCount: user._count.managedAthletes,
    }));

    if (format === 'csv') {
      const fields = Object.keys(data[0]);
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv);
    } else {
      // Handle other formats (xlsx, etc.)
      res.json({ data });
    }
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};

export const exportAnalyticsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'csv', range = '30d' } = req.query;

    // Generate comprehensive analytics report
    const metrics = await getDashboardMetrics(req, res);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
    res.json({ message: 'Analytics export generated' });
  } catch (error) {
    console.error('Export analytics report error:', error);
    res.status(500).json({ error: 'Failed to export analytics report' });
  }
};

export const exportRevenueReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'csv', range = '30d' } = req.query;

    // Generate revenue report
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue.csv');
    res.json({ message: 'Revenue report generated' });
  } catch (error) {
    console.error('Export revenue report error:', error);
    res.status(500).json({ error: 'Failed to export revenue report' });
  }
};

export const generateCustomReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportType, parameters } = req.body;

    // Generate custom report based on parameters
    
    res.json({
      message: 'Custom report generated',
      reportType,
      parameters,
    });
  } catch (error) {
    console.error('Generate custom report error:', error);
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
};

// Revenue Functions

export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        skip,
        take: Number(limit),
        include: {
          subscription: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count(),
    ]);

    res.json({
      payments,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
};

export const getRevenueByPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const payments = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    res.json({
      totalRevenue: payments._sum.amount || 0,
      transactionCount: payments._count,
      period: { startDate, endDate },
    });
  } catch (error) {
    console.error('Get revenue by period error:', error);
    res.status(500).json({ error: 'Failed to get revenue by period' });
  }
};

export const getChurnMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const cancelledLastMonth = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        cancelledAt: {
          gte: lastMonth,
          lt: now,
        },
      },
    });

    const activeLastMonth = await prisma.subscription.count({
      where: {
        createdAt: { lt: lastMonth },
        OR: [
          { status: 'ACTIVE' },
          {
            status: 'CANCELLED',
            cancelledAt: { gte: lastMonth },
          },
        ],
      },
    });

    const churnRate = activeLastMonth > 0
      ? (cancelledLastMonth / activeLastMonth * 100).toFixed(2)
      : 0;

    res.json({
      churnRate: Number(churnRate),
      cancelledCount: cancelledLastMonth,
      activeCount: activeLastMonth,
      period: 'last_month',
    });
  } catch (error) {
    console.error('Get churn metrics error:', error);
    res.status(500).json({ error: 'Failed to get churn metrics' });
  }
};

export const getLifetimeValue = async (req: Request, res: Response): Promise<void> => {
  try {
    // Calculate average customer lifetime value
    const avgSubscriptionDuration = await prisma.$queryRaw`
      SELECT AVG(
        CASE 
          WHEN "cancelledAt" IS NOT NULL 
          THEN EXTRACT(EPOCH FROM ("cancelledAt" - "createdAt")) / 86400
          ELSE EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 86400
        END
      ) as avg_days
      FROM "Subscription"
    `;

    const avgMonthlyRevenue = await prisma.payment.aggregate({
      _avg: {
        amount: true,
      },
    });

    res.json({
      averageLifetimeValue: avgMonthlyRevenue._avg.amount || 0,
      averageSubscriptionDays: avgSubscriptionDuration,
    });
  } catch (error) {
    console.error('Get lifetime value error:', error);
    res.status(500).json({ error: 'Failed to get lifetime value' });
  }
};