import { Request, Response } from 'express';
import { PrismaClient, AccountType } from '@prisma/client';
import {
  hashPassword,
  generateTempPassword,
  validateEmail,
} from '../../auth/utils/auth.utils';

const prisma = new PrismaClient();

/**
 * Create a new athlete account (limited access)
 */
export const createAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { email, firstName, lastName, phoneNumber, dateOfBirth } = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate required fields
    if (!email || !firstName || !lastName) {
      res.status(400).json({ 
        error: 'Email, first name, and last name are required' 
      });
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ 
        error: 'A user with this email already exists',
        hint: 'If this athlete already has an account, they cannot be added as a managed athlete.'
      });
      return;
    }

    // Check coach's athlete limit based on subscription
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      include: {
        subscription: true,
        _count: {
          select: { managedAthletes: true },
        },
      },
    });

    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Check athlete limits based on subscription
    const athleteLimit = {
      COACH_BASIC: 10,
      COACH_PRO: 30,
      COACH_UNLIMITED: -1, // No limit
    };

    const limit = athleteLimit[coach.subscription?.plan as keyof typeof athleteLimit] || 5;
    if (limit !== -1 && coach._count.managedAthletes >= limit) {
      res.status(403).json({ 
        error: 'Athlete limit reached',
        message: `Your ${coach.subscription?.plan} plan allows up to ${limit} athletes. Please upgrade to add more.`,
        currentCount: coach._count.managedAthletes,
        limit,
      });
      return;
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Create athlete account
    const athlete = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        accountType: AccountType.ATHLETE_LIMITED,
        createdByCoachId: coachId,
        mustChangePassword: true, // Force password change on first login
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'CREATE_ATHLETE',
        entityType: 'User',
        entityId: athlete.id,
        metadata: { athleteEmail: athlete.email },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    // Send notification to coach
    await prisma.notification.create({
      data: {
        userId: coachId,
        type: 'NEW_ATHLETE',
        title: 'New Athlete Added',
        message: `${athlete.firstName} ${athlete.lastName} has been added to your team.`,
        metadata: { athleteId: athlete.id },
      },
    });

    res.status(201).json({
      message: 'Athlete account created successfully',
      athlete: {
        id: athlete.id,
        email: athlete.email,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        accountType: athlete.accountType,
        tempPassword, // Send this securely to the athlete
      },
      instructions: 'Please share the temporary password with the athlete securely. They will be required to change it on first login.',
    });
  } catch (error) {
    console.error('Create athlete error:', error);
    res.status(500).json({ error: 'Failed to create athlete account' });
  }
};

/**
 * Get all athletes managed by the coach
 */
export const getAthletes = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const athletes = await prisma.user.findMany({
      where: {
        createdByCoachId: coachId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        isUpgraded: true,
        profileImage: true,
        phoneNumber: true,
        dateOfBirth: true,
        height: true,
        weight: true,
        runningExperience: true,
        weeklyMileage: true,
        preferredDistance: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            analyses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get analysis stats for each athlete
    const athletesWithStats = await Promise.all(
      athletes.map(async (athlete) => {
        const latestAnalysis = await prisma.analysis.findFirst({
          where: { userId: athlete.id },
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
          },
        });

        return {
          ...athlete,
          stats: {
            totalAnalyses: athlete._count.analyses,
            lastAnalysis: latestAnalysis?.createdAt,
          },
        };
      })
    );

    res.json({
      athletes: athletesWithStats,
      total: athletes.length,
    });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ error: 'Failed to get athletes' });
  }
};

/**
 * Get specific athlete details
 */
export const getAthleteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            videoFileName: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            analyses: true,
          },
        },
      },
    });

    if (!athlete) {
      res.status(404).json({ error: 'Athlete not found or not managed by you' });
      return;
    }

    res.json({ athlete });
  } catch (error) {
    console.error('Get athlete by ID error:', error);
    res.status(500).json({ error: 'Failed to get athlete details' });
  }
};

/**
 * Update athlete information
 */
export const updateAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;
    const updates = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if athlete is managed by this coach
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      res.status(404).json({ error: 'Athlete not found or not managed by you' });
      return;
    }

    // Don't allow certain fields to be updated
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phoneNumber',
      'dateOfBirth',
      'height',
      'weight',
      'runningExperience',
      'weeklyMileage',
      'preferredDistance',
      'bio',
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const updatedAthlete = await prisma.user.update({
      where: { id: athleteId },
      data: filteredUpdates,
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
        bio: true,
      },
    });

    res.json({
      message: 'Athlete updated successfully',
      athlete: updatedAthlete,
    });
  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
};

/**
 * Reset athlete's password
 */
export const resetAthletePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if athlete is managed by this coach
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      res.status(404).json({ error: 'Athlete not found or not managed by you' });
      return;
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Update athlete's password
    await prisma.user.update({
      where: { id: athleteId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'RESET_ATHLETE_PASSWORD',
        entityType: 'User',
        entityId: athleteId,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: 'Password reset successfully',
      tempPassword,
      instructions: 'Please share this new password with the athlete securely. They will be required to change it on next login.',
    });
  } catch (error) {
    console.error('Reset athlete password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

/**
 * Remove (deactivate) athlete account
 */
export const removeAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if athlete is managed by this coach
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      res.status(404).json({ error: 'Athlete not found or not managed by you' });
      return;
    }

    // Don't delete if athlete has upgraded
    if (athlete.isUpgraded) {
      res.status(403).json({ 
        error: 'Cannot remove upgraded athlete',
        message: 'This athlete has upgraded to an individual account and is no longer under your management.'
      });
      return;
    }

    // Soft delete (deactivate) the athlete
    await prisma.user.update({
      where: { id: athleteId },
      data: { isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'REMOVE_ATHLETE',
        entityType: 'User',
        entityId: athleteId,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({ message: 'Athlete removed successfully' });
  } catch (error) {
    console.error('Remove athlete error:', error);
    res.status(500).json({ error: 'Failed to remove athlete' });
  }
};