// backend/src/modules/coach/services/coach.service.ts

import { PrismaClient, AccountType, SubscriptionPlan } from '@prisma/client';
import { hashPassword, generateTempPassword } from '../../auth/utils/auth.utils';

const prisma = new PrismaClient();

interface CreateAthleteData {
  email: string;
  firstName: string;
  lastName: string;
  notes?: string;
  injuryHistory?: string[];
  primaryGoal?: string;
  gender?: string;
  dateOfBirth?: Date;
  height?: number;
  weight?: number;
  unitPreference?: string;
  preferredDistance?: string;
}

interface AthleteInvitation {
  athleteEmail: string;
  coachId: string;
}

export class CoachService {
  /**
   * Get all athletes managed by a coach
   */
  async getAthletes(coachId: string): Promise<any> {
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
        createdAt: true,
        lastLoginAt: true,
        primaryGoal: true,
        injuryHistory: true,
        gender: true,
        dateOfBirth: true,
        height: true,
        weight: true,
        unitPreference: true,
        preferredDistance: true,
        runningExperience: true,
        weeklyMileage: true,
        personalBest: true,
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

    // Get last analysis date for each athlete
    const athletesWithStats = await Promise.all(
      athletes.map(async (athlete) => {
        const lastAnalysis = await prisma.analysis.findFirst({
          where: { userId: athlete.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          ...athlete,
          stats: {
            totalAnalyses: athlete._count.analyses,
            lastAnalysisDate: lastAnalysis?.createdAt || null,
          },
        };
      })
    );

    return athletesWithStats;
  }

  /**
   * Get a specific athlete by ID
   */
  async getAthlete(coachId: string, athleteId: string): Promise<any> {
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            analyses: true,
          },
        },
      },
    });

    if (!athlete) {
      throw new Error('Athlete not found or not managed by you');
    }

    // Get analyses stats
    const analyses = await prisma.analysis.findMany({
      where: { userId: athleteId },
      select: {
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedAnalyses = analyses.filter((a) => a.status === 'COMPLETED');
    const lastAnalysis = analyses[0];

    return {
      ...athlete,
      stats: {
        totalAnalyses: athlete._count.analyses,
        completedAnalyses: completedAnalyses.length,
        lastAnalysisDate: lastAnalysis?.createdAt || null,
      },
    };
  }

  /**
   * Create a new athlete (coach-created account)
   */
  async createAthlete(coachId: string, data: CreateAthleteData): Promise<any> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Create the athlete
    const athlete = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        accountType: AccountType.ATHLETE_LIMITED,
        createdByCoachId: coachId,
        mustChangePassword: true,
        
        // Running profile data
        primaryGoal: data.primaryGoal,
        injuryHistory: data.injuryHistory || [],
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        unitPreference: data.unitPreference,
        preferredDistance: data.preferredDistance,
        
        // Initialize usage record
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

    // Send notification to athlete (you can implement email service later)
    await prisma.notification.create({
      data: {
        userId: athlete.id,
        type: 'ACCOUNT_CREATED',
        title: 'Your Movaia Account',
        message: `Your coach has created a Movaia account for you. Temporary password: ${tempPassword}. Please change it on first login.`,
        metadata: { coachId, tempPassword },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'CREATE_ATHLETE',
        entityType: 'User',
        entityId: athlete.id,
        metadata: { athleteEmail: data.email },
      },
    });

    return {
      athlete,
      tempPassword, // Return temp password to coach
    };
  }

  /**
   * Update athlete profile
   */
  async updateAthlete(
    coachId: string,
    athleteId: string,
    data: Partial<CreateAthleteData>
  ): Promise<any> {
    // Verify ownership
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      throw new Error('Athlete not found or not managed by you');
    }

    // Only allow updates if athlete is not upgraded (still coach-managed)
    if (athlete.isUpgraded) {
      throw new Error('Cannot edit profile of upgraded athlete. They must edit their own profile.');
    }

    // Update athlete
    const updatedAthlete = await prisma.user.update({
      where: { id: athleteId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        primaryGoal: data.primaryGoal,
        injuryHistory: data.injuryHistory,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        unitPreference: data.unitPreference,
        preferredDistance: data.preferredDistance,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'UPDATE_ATHLETE',
        entityType: 'User',
        entityId: athleteId,
      },
    });

    return updatedAthlete;
  }

  /**
   * Reset athlete password
   */
  async resetAthletePassword(coachId: string, athleteId: string): Promise<string> {
    // Verify ownership
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      throw new Error('Athlete not found or not managed by you');
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Update password
    await prisma.user.update({
      where: { id: athleteId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: athleteId,
        type: 'PASSWORD_RESET',
        title: 'Password Reset',
        message: `Your coach has reset your password. New temporary password: ${tempPassword}`,
        metadata: { tempPassword },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'RESET_ATHLETE_PASSWORD',
        entityType: 'User',
        entityId: athleteId,
      },
    });

    return tempPassword;
  }

  /**
   * Disconnect/Remove athlete
   */
  async removeAthlete(coachId: string, athleteId: string): Promise<void> {
    // Verify ownership
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      throw new Error('Athlete not found or not managed by you');
    }

    // If athlete is upgraded, just disconnect (remove coach relationship)
    if (athlete.isUpgraded) {
      await prisma.user.update({
        where: { id: athleteId },
        data: {
          createdByCoachId: null,
          previousCoachId: coachId,
        },
      });

      // Notify athlete
      await prisma.notification.create({
        data: {
          userId: athleteId,
          type: 'COACH_DISCONNECTED',
          title: 'Coach Disconnected',
          message: 'Your coach has disconnected your account.',
        },
      });
    } else {
      // If not upgraded, deactivate the account
      await prisma.user.update({
        where: { id: athleteId },
        data: {
          isActive: false,
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'REMOVE_ATHLETE',
        entityType: 'User',
        entityId: athleteId,
        metadata: { wasUpgraded: athlete.isUpgraded },
      },
    });
  }

  /**
   * Get analyses for a specific athlete
   */
  async getAthleteAnalyses(
    coachId: string,
    athleteId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    // Verify ownership
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        createdByCoachId: coachId,
      },
    });

    if (!athlete) {
      throw new Error('Athlete not found or not managed by you');
    }

    const skip = (page - 1) * limit;

    const [analyses, total] = await prisma.$transaction([
      prisma.analysis.findMany({
        where: { userId: athleteId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedByCoach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.analysis.count({
        where: { userId: athleteId },
      }),
    ]);

    return {
      analyses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      athlete: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
      },
    };
  }

  /**
   * Get all analyses for all athletes (for coach dashboard)
   */
  async getAllAthletesAnalyses(
    coachId: string,
    filters?: {
      athleteId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { userId: coachId }, // Coach's own analyses
        { uploadedByCoachId: coachId }, // Analyses uploaded by coach
      ],
    };

    // If filtering by specific athlete
    if (filters?.athleteId) {
      where.userId = filters.athleteId;
      delete where.OR;
    }

    // Filter by status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [analyses, total] = await prisma.$transaction([
      prisma.analysis.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          uploadedByCoach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    return {
      analyses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Invite existing Movaia user to connect as athlete
   * This creates a notification for the athlete to accept
   */
  async inviteAthlete(coachId: string, athleteEmail: string): Promise<any> {
    // Find the athlete
    const athlete = await prisma.user.findUnique({
      where: { email: athleteEmail.toLowerCase() },
    });

    if (!athlete) {
      throw new Error('User with this email not found on Movaia');
    }

    if (athlete.accountType !== AccountType.INDIVIDUAL) {
      throw new Error('Can only invite Individual account users');
    }

    if (athlete.createdByCoachId === coachId) {
      throw new Error('This athlete is already connected to you');
    }

    if (athlete.createdByCoachId) {
      throw new Error('This athlete is already connected to another coach');
    }

    // Get coach info
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Create notification for athlete
    await prisma.notification.create({
      data: {
        userId: athlete.id,
        type: 'COACH_INVITE',
        title: 'Coach Connection Request',
        message: `${coach?.firstName} ${coach?.lastName} (${coach?.email}) has invited you to connect as their athlete.`,
        metadata: {
          coachId,
          coachName: `${coach?.firstName} ${coach?.lastName}`,
          coachEmail: coach?.email,
          action: 'pending',
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: coachId,
        action: 'INVITE_ATHLETE',
        entityType: 'User',
        entityId: athlete.id,
        metadata: { athleteEmail },
      },
    });

    return {
      message: 'Invitation sent successfully',
      athlete: {
        id: athlete.id,
        email: athlete.email,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
      },
    };
  }

  /**
   * Get coach statistics
   */
  async getCoachStats(coachId: string): Promise<any> {
    const [
      totalAthletes,
      totalAnalyses,
      completedAnalyses,
      processingAnalyses,
      recentAnalyses,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdByCoachId: coachId,
          isActive: true,
        },
      }),
      prisma.analysis.count({
        where: {
          OR: [{ userId: coachId }, { uploadedByCoachId: coachId }],
        },
      }),
      prisma.analysis.count({
        where: {
          OR: [{ userId: coachId }, { uploadedByCoachId: coachId }],
          status: 'COMPLETED',
        },
      }),
      prisma.analysis.count({
        where: {
          OR: [{ userId: coachId }, { uploadedByCoachId: coachId }],
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      prisma.analysis.findMany({
        where: {
          OR: [{ userId: coachId }, { uploadedByCoachId: coachId }],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      totalAthletes,
      totalAnalyses,
      completedAnalyses,
      processingAnalyses,
      recentAnalyses,
    };
  }
}

export const coachService = new CoachService();