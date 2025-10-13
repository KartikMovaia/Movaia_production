// backend/src/modules/auth/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, AccountType, SubscriptionPlan } from '@prisma/client';
import {
  hashPassword,
  comparePassword,
  generateTokenPair,
  validatePassword,
  validateEmail,
  verifyToken,
} from '../utils/auth.utils';

const prisma = new PrismaClient();

/**
 * Register a new user with onboarding data
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      accountType,
      runningProfile // New onboarding data
    } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !accountType) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate account type (only INDIVIDUAL or COACH for self-registration)
    if (!['INDIVIDUAL', 'COACH'].includes(accountType)) {
      res.status(400).json({ 
        error: 'Invalid account type. Must be INDIVIDUAL or COACH' 
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine default subscription plan
    let subscriptionPlan: SubscriptionPlan = SubscriptionPlan.FREE;
    if (accountType === 'COACH') {
      subscriptionPlan = SubscriptionPlan.COACH_BASIC;
    }

    // Process running profile data
    const profileData: any = {};
    
    if (runningProfile) {
      // Store primary goal
      if (runningProfile.primaryGoal) {
        profileData.primaryGoal = runningProfile.primaryGoal;
      }

      // Store injury history as JSON
      if (runningProfile.injuryHistory) {
        profileData.injuryHistory = runningProfile.injuryHistory;
      }

      // Convert height based on unit preference
      if (runningProfile.height) {
        profileData.height = runningProfile.unitPreference === 'imperial' 
          ? runningProfile.height * 2.54 // Convert inches to cm
          : runningProfile.height;
      }

      // Convert weight based on unit
      if (runningProfile.weight) {
        profileData.weight = runningProfile.weightUnit === 'lbs'
          ? runningProfile.weight * 0.453592 // Convert lbs to kg
          : runningProfile.weight;
      }

      // Set preferred distance
      if (runningProfile.preferredDistance) {
        profileData.preferredDistance = runningProfile.preferredDistance;
      }

      // Parse date of birth
      if (runningProfile.dateOfBirth) {
        profileData.dateOfBirth = new Date(runningProfile.dateOfBirth);
      }

      // Store gender
      if (runningProfile.gender) {
        profileData.gender = runningProfile.gender;
      }

      // Store unit preference
      if (runningProfile.unitPreference) {
        profileData.unitPreference = runningProfile.unitPreference;
      }

      // Store personal best as JSON
      if (runningProfile.personalBest) {
        profileData.personalBest = runningProfile.personalBest;
      }

      // Store running experience level based on profile
      profileData.runningExperience = determineExperienceLevel(runningProfile);
    }

    // Create user and initial subscription
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        accountType: accountType as AccountType,
        ...profileData, // Spread the profile data
        subscription: {
          create: {
            plan: subscriptionPlan,
            status: 'TRIAL',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          },
        },
        // Initialize usage record for the current month
        usageRecords: {
          create: {
            month: parseInt(new Date().toISOString().slice(0, 7).replace('-', '')),
            count: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        createdAt: true,
      },
    });

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        expiresAt,
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      },
    });

    // Generate tokens
    const tokens = generateTokenPair(user, session.id);

    // Update session with tokens
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entityType: 'User',
        entityId: user.id,
        metadata: { 
          accountType,
          hasRunningProfile: !!runningProfile,
          primaryGoal: runningProfile?.primaryGoal,
        },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
      },
      tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

/**
 * Helper function to determine experience level based on profile
 */
function determineExperienceLevel(profile: any): string {
  if (!profile) return 'Beginner';
  
  // No injuries and has personal best = likely experienced
  if (profile.injuryHistory?.includes('No injury') && profile.personalBest?.time) {
    if (profile.preferredDistance?.includes('Marathon') || profile.preferredDistance?.includes('Ultra')) {
      return 'Advanced';
    }
    return 'Intermediate';
  }
  
  // Has injuries = possibly pushing too hard or improper form
  if (profile.injuryHistory?.length > 2) {
    return 'Intermediate'; // Experienced but needs form work
  }
  
  // Goal is not sure = likely beginner
  if (profile.primaryGoal === 'not_sure') {
    return 'Beginner';
  }
  
  return 'Beginner';
}

/**
 * Login user (no changes needed)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        expiresAt,
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      },
    });

    // Generate tokens
    const tokens = generateTokenPair(user, session.id);

    // Update session with tokens
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        mustChangePassword: user.mustChangePassword,
        isUpgraded: user.isUpgraded,
        subscription: user.subscription,
        createdByCoach: user.createdByCoach,
      },
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

/**
 * Logout user (no changes needed)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Delete session
    await prisma.session.deleteMany({
      where: { token },
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

/**
 * Get current user info (updated to include running profile)
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

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
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            accountType: true,
            isUpgraded: true,
            createdAt: true,
          },
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

    // Get current month usage
    const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month: {
          userId: user.id,
          month: currentMonth,
        },
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isUpgraded: user.isUpgraded,
        mustChangePassword: user.mustChangePassword,
        createdByCoach: user.createdByCoach,
        subscription: user.subscription,
        managedAthletes: user.accountType === 'COACH' ? user.managedAthletes : undefined,
        // Include running profile data
        runningProfile: {
          primaryGoal: user.primaryGoal,
          injuryHistory: user.injuryHistory,
          preferredDistance: user.preferredDistance,
          height: user.height,
          weight: user.weight,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          unitPreference: user.unitPreference,
          personalBest: user.personalBest,
          runningExperience: user.runningExperience,
        },
        stats: {
          totalAnalyses: user._count.analyses,
          totalAthletes: user._count.managedAthletes,
          monthlyUsage: usage?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

/**
 * Refresh access token (no changes needed)
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair(session.user, session.id);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    res.json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
};

/**
 * Change password (no changes needed)
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords are required' });
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({ 
        error: 'New password does not meet requirements',
        details: passwordValidation.errors 
      });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and reset flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};