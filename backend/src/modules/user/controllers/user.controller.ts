// backend/src/modules/user/controllers/user.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Get user profile
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        dateOfBirth: true,
        height: true,
        weight: true,
        runningExperience: true,
        weeklyMileage: true,
        preferredDistance: true,
        primaryGoal: true,
        injuryHistory: true,
        gender: true,
        unitPreference: true,
        personalBest: true,
        bio: true,
        profileImage: true,
        createdAt: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ profile: user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated through this endpoint
    delete updates.id;
    delete updates.email;
    delete updates.password;
    delete updates.accountType;
    delete updates.isActive;
    delete updates.isEmailVerified;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        dateOfBirth: true,
        height: true,
        weight: true,
        runningExperience: true,
        weeklyMileage: true,
        preferredDistance: true,
        primaryGoal: true,
        injuryHistory: true,
        gender: true,
        unitPreference: true,
        personalBest: true,
        bio: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE_PROFILE',
        metadata: { fieldsUpdated: Object.keys(updates) },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.json({ 
      message: 'Profile updated successfully',
      profile: updatedUser 
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    // Generate unique key for S3
    const key = `profile-images/${userId}/${uuidv4()}-${file.originalname}`;
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await s3Client.send(command);
    
    const profileImageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Delete old image if exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true }
    });

    if (user?.profileImage) {
      const oldKey = user.profileImage.split('.amazonaws.com/')[1];
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: oldKey
      });
      await s3Client.send(deleteCommand).catch(console.error);
    }

    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: profileImageUrl }
    });

    res.json({ 
      message: 'Profile image uploaded successfully',
      profileImageUrl 
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};

/**
 * Delete profile image
 */
export const deleteProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true }
    });

    if (user?.profileImage) {
      const key = user.profileImage.split('.amazonaws.com/')[1];
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
      });
      await s3Client.send(deleteCommand);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null }
    });

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
};

/**
 * Get current subscription
 */
export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!subscription) {
      // Return free plan if no subscription
      res.json({
        subscription: {
          plan: SubscriptionPlan.FREE,
          status: 'ACTIVE',
          currentPeriodEnd: null,
          cancelledAt: null
        }
      });
      return;
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

/**
 * Get available plans based on account type
 */
export const getAvailablePlans = async (req: Request, res: Response): Promise<void> => {
  try {
    // Can be called with or without authentication
    const accountType = req.currentUser?.accountType;
    const currentPlan = req.currentUser ? await prisma.subscription.findUnique({
      where: { userId: req.currentUser.id },
      select: { plan: true }
    }) : null;

    interface PlanInfo {
      id: SubscriptionPlan;
      name: string;
      price: number;
      features: string[];
      limit: number | string;
      athleteLimit?: number | string;
      popular?: boolean;
      current?: boolean;
    }

    let plans: PlanInfo[] = [];
    
    // If not authenticated or INDIVIDUAL account type, show individual plans
    if (!accountType || accountType === 'INDIVIDUAL') {
      plans = [
        {
          id: SubscriptionPlan.FREE,
          name: 'Free',
          price: 0,
          features: [
            '2 analyses per month',
            'Basic running form insights', 
            'Email support',
            'Single video upload'
          ],
          limit: 2,
          current: currentPlan?.plan === SubscriptionPlan.FREE
        },
        {
          id: SubscriptionPlan.INDIVIDUAL_BASIC,
          name: 'Basic',
          price: 9.99,
          features: [
            '10 analyses per month',
            'Advanced running metrics',
            'Injury risk assessment',
            'Priority email support',
            'Video history & comparison'
          ],
          limit: 10,
          popular: true,
          current: currentPlan?.plan === SubscriptionPlan.INDIVIDUAL_BASIC
        },
        {
          id: SubscriptionPlan.INDIVIDUAL_PRO,
          name: 'Pro',
          price: 19.99,
          features: [
            'Unlimited analyses',
            'Advanced biomechanical insights',
            'Personalized training recommendations',
            'Priority support',
            'Export reports as PDF',
            'Progress tracking dashboard'
          ],
          limit: 'unlimited',
          current: currentPlan?.plan === SubscriptionPlan.INDIVIDUAL_PRO
        }
      ];
    } else if (accountType === 'COACH') {
      plans = [
        {
          id: SubscriptionPlan.COACH_BASIC,
          name: 'Coach Basic',
          price: 29.99,
          features: [
            '50 analyses per month',
            'Manage up to 10 athletes',
            'Athlete performance dashboard',
            'Bulk video upload',
            'Team insights & reports'
          ],
          limit: 50,
          athleteLimit: 10,
          current: currentPlan?.plan === SubscriptionPlan.COACH_BASIC
        },
        {
          id: SubscriptionPlan.COACH_PRO,
          name: 'Coach Pro',
          price: 59.99,
          features: [
            '200 analyses per month',
            'Manage up to 30 athletes',
            'Advanced team analytics',
            'Custom training plans',
            'Priority support',
            'API access'
          ],
          limit: 200,
          athleteLimit: 30,
          popular: true,
          current: currentPlan?.plan === SubscriptionPlan.COACH_PRO
        },
        {
          id: SubscriptionPlan.COACH_UNLIMITED,
          name: 'Coach Unlimited',
          price: 99.99,
          features: [
            'Unlimited analyses',
            'Unlimited athletes',
            'White-label options',
            'Dedicated account manager',
            'Custom integrations',
            'Advanced API access'
          ],
          limit: 'unlimited',
          athleteLimit: 'unlimited',
          current: currentPlan?.plan === SubscriptionPlan.COACH_UNLIMITED
        }
      ];
    } else if (!accountType) {
      // Show all plans for unauthenticated users (for pricing page)
      const individualPlans = [
        {
          id: SubscriptionPlan.FREE,
          name: 'Free',
          price: 0,
          features: ['2 analyses per month', 'Basic insights', 'Email support'],
          limit: 2
        },
        {
          id: SubscriptionPlan.INDIVIDUAL_BASIC,
          name: 'Basic',
          price: 9.99,
          features: ['10 analyses per month', 'Advanced insights', 'Priority support'],
          limit: 10,
          popular: true
        },
        {
          id: SubscriptionPlan.INDIVIDUAL_PRO,
          name: 'Pro',
          price: 19.99,
          features: ['Unlimited analyses', 'Premium features', '24/7 support'],
          limit: 'unlimited'
        }
      ];
      
      const coachPlans = [
        {
          id: SubscriptionPlan.COACH_BASIC,
          name: 'Coach Basic',
          price: 29.99,
          features: ['50 analyses per month', 'Up to 10 athletes', 'Team insights'],
          limit: 50,
          athleteLimit: 10
        },
        {
          id: SubscriptionPlan.COACH_PRO,
          name: 'Coach Pro',
          price: 59.99,
          features: ['200 analyses per month', 'Up to 30 athletes', 'Advanced analytics'],
          limit: 200,
          athleteLimit: 30,
          popular: true
        },
        {
          id: SubscriptionPlan.COACH_UNLIMITED,
          name: 'Coach Unlimited',
          price: 99.99,
          features: ['Unlimited analyses', 'Unlimited athletes', 'Premium support'],
          limit: 'unlimited',
          athleteLimit: 'unlimited'
        }
      ];
      
      plans = [...individualPlans, ...coachPlans];
    }

    res.json({ plans });
  } catch (error) {
    console.error('Get available plans error:', error);
    res.status(500).json({ error: 'Failed to get available plans' });
  }
};

/**
 * Get billing history
 */
export const getBillingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      subscription: { userId }
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: { plan: true }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
      subscriptionPlan: payment.subscription.plan
    }));

    res.json({ 
      payments: formattedPayments,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
};

/**
 * Get payment methods (Stripe integration)
 */
export const getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    });

    if (!user?.subscription?.stripeCustomerId) {
      res.json({ paymentMethods: [] });
      return;
    }

    // This would integrate with Stripe to get actual payment methods
    // For now, returning mock data structure
    const paymentMethods = [
      {
        id: 'pm_mock_1',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      }
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
};

/**
 * Get active sessions
 */
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const currentSessionId = req.user?.sessionId;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true
      }
    });

    const formattedSessions = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/**
 * Revoke session
 */
export const revokeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { sessionId } = req.params;

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

/**
 * Export user data (GDPR compliance)
 */
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        analyses: true,
        sessions: {
          select: {
            id: true,
            deviceInfo: true,
            ipAddress: true,
            createdAt: true
          }
        },
        activityLogs: {
          select: {
            action: true,
            createdAt: true,
            metadata: true
          }
        }
      }
    });

    if (!userData) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive data
    const exportData = {
      ...userData,
      password: undefined,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined
    };

    res.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { password, reason } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true }
    });

    const validPassword = await bcrypt.compare(password, user!.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid password' });
      return;
    }

    // Log deletion reason
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETION_REQUESTED',
        metadata: { reason },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    // Soft delete (mark as inactive) instead of hard delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user!.email}` // Prevent email reuse
      }
    });

    // Revoke all sessions
    await prisma.session.deleteMany({
      where: { userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { reason } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }

    // This would integrate with Stripe to cancel subscription
    // For now, just update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // Log cancellation
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'Subscription',
        entityId: subscription.id,
        metadata: { reason, plan: subscription.plan },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};