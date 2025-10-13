import { PrismaClient, AccountType, SubscriptionPlan, SubscriptionStatus, AnalysisStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Clearing existing data...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.usageRecord.deleteMany({});
  await prisma.analysis.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Database cleared');

  // Helper function to hash passwords
  const hashPassword = async (password: string) => bcrypt.hash(password, 10);

  // Current month for usage records
  const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
  const currentDate = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // ===========================================
  // CREATE ADMIN USER
  // ===========================================
  const admin = await prisma.user.create({
    data: {
      email: 'admin@runform.com',
      password: await hashPassword('Admin123!'),
      firstName: 'System',
      lastName: 'Admin',
      accountType: AccountType.ADMIN,
      isEmailVerified: true,
      profileImage: 'https://ui-avatars.com/api/?name=System+Admin&background=6366f1&color=fff',
      bio: 'Platform Administrator',
      createdAt: new Date('2024-01-01'),
      lastLoginAt: currentDate,
    },
  });
  console.log('👨‍💼 Admin created:', admin.email);

  // ===========================================
  // CREATE INDIVIDUAL USERS (Self-registered runners)
  // ===========================================
  
  // Individual 1 - Free Plan
  const individual1 = await prisma.user.create({
    data: {
      email: 'john.runner@example.com',
      password: await hashPassword('Runner123!'),
      firstName: 'John',
      lastName: 'Runner',
      accountType: AccountType.INDIVIDUAL,
      isEmailVerified: true,
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-05-15'),
      height: 180, // cm
      weight: 75, // kg
      runningExperience: 'Intermediate',
      weeklyMileage: 25,
      preferredDistance: '10k',
      profileImage: 'https://ui-avatars.com/api/?name=John+Runner&background=10b981&color=fff',
      bio: 'Recreational runner training for my first marathon',
      createdAt: new Date('2024-06-01'),
      lastLoginAt: new Date('2025-01-14'),
      subscription: {
        create: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2025-01-01'),
          currentPeriodEnd: new Date('2025-01-31'),
        },
      },
      usageRecords: {
        create: {
          month: currentMonth,
          count: 1,
        },
      },
    },
  });
  console.log('🏃 Individual (Free) created:', individual1.email);

  // Individual 2 - Pro Plan
  const individual2 = await prisma.user.create({
    data: {
      email: 'sarah.athlete@example.com',
      password: await hashPassword('Athlete123!'),
      firstName: 'Sarah',
      lastName: 'Athlete',
      accountType: AccountType.INDIVIDUAL,
      isEmailVerified: true,
      phoneNumber: '+1234567891',
      dateOfBirth: new Date('1988-03-22'),
      height: 168,
      weight: 58,
      runningExperience: 'Advanced',
      weeklyMileage: 50,
      preferredDistance: 'Half Marathon',
      profileImage: 'https://ui-avatars.com/api/?name=Sarah+Athlete&background=ec4899&color=fff',
      bio: 'Competitive runner, Boston Marathon qualifier',
      createdAt: new Date('2024-03-15'),
      lastLoginAt: new Date('2025-01-13'),
      subscription: {
        create: {
          plan: SubscriptionPlan.INDIVIDUAL_PRO,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2025-01-01'),
          currentPeriodEnd: new Date('2025-01-31'),
          stripeCustomerId: 'cus_test_individual2',
          stripeSubscriptionId: 'sub_test_individual2',
        },
      },
      usageRecords: {
        create: {
          month: currentMonth,
          count: 8,
        },
      },
    },
  });
  console.log('🏃 Individual (Pro) created:', individual2.email);

  // ===========================================
  // CREATE COACH USERS
  // ===========================================

  // Coach 1 - Basic Plan with athletes
  const coach1 = await prisma.user.create({
    data: {
      email: 'coach.wilson@example.com',
      password: await hashPassword('Coach123!'),
      firstName: 'Robert',
      lastName: 'Wilson',
      accountType: AccountType.COACH,
      isEmailVerified: true,
      phoneNumber: '+1234567892',
      dateOfBirth: new Date('1975-08-10'),
      runningExperience: 'Elite',
      profileImage: 'https://ui-avatars.com/api/?name=Robert+Wilson&background=f59e0b&color=fff',
      bio: 'Certified running coach with 15 years experience. USATF Level 2.',
      createdAt: new Date('2024-02-01'),
      lastLoginAt: new Date('2025-01-14'),
      subscription: {
        create: {
          plan: SubscriptionPlan.COACH_BASIC,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2025-01-01'),
          currentPeriodEnd: new Date('2025-01-31'),
          stripeCustomerId: 'cus_test_coach1',
          stripeSubscriptionId: 'sub_test_coach1',
        },
      },
      usageRecords: {
        create: {
          month: currentMonth,
          count: 12,
        },
      },
    },
  });
  console.log('🏋️ Coach (Basic) created:', coach1.email);

  // Coach 2 - Pro Plan
  const coach2 = await prisma.user.create({
    data: {
      email: 'coach.martinez@example.com',
      password: await hashPassword('Coach123!'),
      firstName: 'Maria',
      lastName: 'Martinez',
      accountType: AccountType.COACH,
      isEmailVerified: true,
      phoneNumber: '+1234567893',
      dateOfBirth: new Date('1982-11-25'),
      runningExperience: 'Elite',
      profileImage: 'https://ui-avatars.com/api/?name=Maria+Martinez&background=8b5cf6&color=fff',
      bio: 'Olympic trials qualifier, specializing in middle-distance training',
      createdAt: new Date('2024-01-15'),
      lastLoginAt: new Date('2025-01-13'),
      subscription: {
        create: {
          plan: SubscriptionPlan.COACH_PRO,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2025-01-01'),
          currentPeriodEnd: new Date('2025-01-31'),
          stripeCustomerId: 'cus_test_coach2',
          stripeSubscriptionId: 'sub_test_coach2',
        },
      },
      usageRecords: {
        create: {
          month: currentMonth,
          count: 45,
        },
      },
    },
  });
  console.log('🏋️ Coach (Pro) created:', coach2.email);

  // ===========================================
  // CREATE LIMITED ATHLETE ACCOUNTS (Coach-created)
  // ===========================================

  // Athletes for Coach 1
  const athlete1 = await prisma.user.create({
    data: {
      email: 'mike.athlete@example.com',
      password: await hashPassword('TempPass123!'),
      firstName: 'Mike',
      lastName: 'Johnson',
      accountType: AccountType.ATHLETE_LIMITED,
      createdByCoachId: coach1.id,
      mustChangePassword: false, // Already changed
      phoneNumber: '+1234567894',
      dateOfBirth: new Date('1995-07-18'),
      height: 185,
      weight: 78,
      runningExperience: 'Beginner',
      weeklyMileage: 15,
      preferredDistance: '5k',
      profileImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=3b82f6&color=fff',
      bio: 'New to running, training for first 5k',
      createdAt: new Date('2024-09-01'),
      lastLoginAt: new Date('2025-01-12'),
    },
  });

  const athlete2 = await prisma.user.create({
    data: {
      email: 'lisa.chen@example.com',
      password: await hashPassword('TempPass123!'),
      firstName: 'Lisa',
      lastName: 'Chen',
      accountType: AccountType.ATHLETE_LIMITED,
      createdByCoachId: coach1.id,
      mustChangePassword: true, // Hasn't changed yet
      phoneNumber: '+1234567895',
      dateOfBirth: new Date('1992-02-28'),
      height: 162,
      weight: 54,
      runningExperience: 'Intermediate',
      weeklyMileage: 30,
      preferredDistance: '10k',
      profileImage: 'https://ui-avatars.com/api/?name=Lisa+Chen&background=06b6d4&color=fff',
      createdAt: new Date('2024-10-15'),
    },
  });

  const athlete3 = await prisma.user.create({
    data: {
      email: 'david.brown@example.com',
      password: await hashPassword('TempPass123!'),
      firstName: 'David',
      lastName: 'Brown',
      accountType: AccountType.ATHLETE_LIMITED,
      createdByCoachId: coach1.id,
      mustChangePassword: false,
      isUpgraded: true, // This athlete upgraded to Individual
      upgradedAt: new Date('2024-12-01'),
      phoneNumber: '+1234567896',
      dateOfBirth: new Date('1998-09-12'),
      height: 178,
      weight: 72,
      runningExperience: 'Intermediate',
      weeklyMileage: 35,
      preferredDistance: 'Half Marathon',
      profileImage: 'https://ui-avatars.com/api/?name=David+Brown&background=84cc16&color=fff',
      bio: 'Upgraded to individual plan for self-analysis',
      createdAt: new Date('2024-08-20'),
      lastLoginAt: new Date('2025-01-14'),
      subscription: {
        create: {
          plan: SubscriptionPlan.INDIVIDUAL_BASIC,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2025-01-01'),
          currentPeriodEnd: new Date('2025-01-31'),
        },
      },
      usageRecords: {
        create: {
          month: currentMonth,
          count: 3,
        },
      },
    },
  });

  console.log('👥 Athletes for Coach 1 created:', 3);

  // Athletes for Coach 2
  const athlete4 = await prisma.user.create({
    data: {
      email: 'emily.white@example.com',
      password: await hashPassword('TempPass123!'),
      firstName: 'Emily',
      lastName: 'White',
      accountType: AccountType.ATHLETE_LIMITED,
      createdByCoachId: coach2.id,
      mustChangePassword: false,
      phoneNumber: '+1234567897',
      dateOfBirth: new Date('2000-04-05'),
      height: 170,
      weight: 60,
      runningExperience: 'Advanced',
      weeklyMileage: 45,
      preferredDistance: 'Marathon',
      profileImage: 'https://ui-avatars.com/api/?name=Emily+White&background=f472b6&color=fff',
      createdAt: new Date('2024-07-10'),
      lastLoginAt: new Date('2025-01-13'),
    },
  });

  const athlete5 = await prisma.user.create({
    data: {
      email: 'james.taylor@example.com',
      password: await hashPassword('TempPass123!'),
      firstName: 'James',
      lastName: 'Taylor',
      accountType: AccountType.ATHLETE_LIMITED,
      createdByCoachId: coach2.id,
      mustChangePassword: false,
      phoneNumber: '+1234567898',
      dateOfBirth: new Date('1997-12-20'),
      height: 182,
      weight: 76,
      runningExperience: 'Intermediate',
      weeklyMileage: 40,
      preferredDistance: 'Half Marathon',
      profileImage: 'https://ui-avatars.com/api/?name=James+Taylor&background=dc2626&color=fff',
      createdAt: new Date('2024-06-25'),
      lastLoginAt: new Date('2025-01-11'),
    },
  });

  console.log('👥 Athletes for Coach 2 created:', 2);

  // ===========================================
  // CREATE SAMPLE ANALYSES
  // ===========================================

  // Analyses for Individual 1
  await prisma.analysis.create({
    data: {
      userId: individual1.id,
      videoFileName: 'john_run_2025_01_10.mp4',
      videoFileSize: 52428800, // 50MB
      videoDuration: 45.5,
      status: AnalysisStatus.COMPLETED,
      cadence: 172,
      strideLength: 1.2,
      verticalOscillation: 8.5,
      groundContactTime: 245,
      footStrike: 'Midfoot',
      performanceScore: 75,
      injuryRiskScore: 25,
      aiInsights: 'Good overall form with slight overpronation. Consider strengthening exercises for ankles.',
      recommendations: ['Increase cadence by 5%', 'Focus on landing under center of mass', 'Add ankle strengthening exercises'],
      tags: ['outdoor', 'tempo run'],
      createdAt: new Date('2025-01-10'),
    },
  });

  // Analyses for Individual 2 (multiple)
  const analysisData = [
    { date: '2025-01-05', score: 82 },
    { date: '2025-01-08', score: 85 },
    { date: '2025-01-11', score: 87 },
    { date: '2025-01-13', score: 88 },
  ];

  for (const data of analysisData) {
    await prisma.analysis.create({
      data: {
        userId: individual2.id,
        videoFileName: `sarah_run_${data.date.replace(/-/g, '_')}.mp4`,
        videoFileSize: 62914560,
        videoDuration: 60,
        status: AnalysisStatus.COMPLETED,
        cadence: 180,
        strideLength: 1.35,
        verticalOscillation: 6.2,
        groundContactTime: 220,
        footStrike: 'Forefoot',
        performanceScore: data.score,
        injuryRiskScore: 15,
        aiInsights: 'Excellent running form. Elite-level metrics across all parameters.',
        recommendations: ['Maintain current form', 'Consider slight increase in stride length for race pace'],
        tags: ['track', 'interval training'],
        createdAt: new Date(data.date),
      },
    });
  }

  // Analyses for Coach 1's own running
  await prisma.analysis.create({
    data: {
      userId: coach1.id,
      videoFileName: 'coach_wilson_form_check.mp4',
      videoFileSize: 41943040,
      videoDuration: 30,
      status: AnalysisStatus.COMPLETED,
      cadence: 175,
      strideLength: 1.28,
      verticalOscillation: 7.0,
      groundContactTime: 235,
      footStrike: 'Midfoot',
      performanceScore: 80,
      injuryRiskScore: 20,
      aiInsights: 'Solid form for masters athlete. Some age-related stiffness noted.',
      recommendations: ['Add dynamic stretching routine', 'Focus on hip mobility'],
      tags: ['self-analysis', 'easy run'],
      createdAt: new Date('2025-01-07'),
    },
  });

  // Analyses for Athletes (uploaded by coaches)
  await prisma.analysis.create({
    data: {
      userId: athlete1.id,
      uploadedByCoachId: coach1.id,
      videoFileName: 'mike_5k_training.mp4',
      videoFileSize: 31457280,
      videoDuration: 25,
      status: AnalysisStatus.COMPLETED,
      cadence: 165,
      strideLength: 1.1,
      verticalOscillation: 10.5,
      groundContactTime: 265,
      footStrike: 'Heel',
      performanceScore: 65,
      injuryRiskScore: 35,
      aiInsights: 'Beginner form showing common issues. Focus on gradual improvements.',
      recommendations: ['Work on cadence drills', 'Strengthen core', 'Consider gait analysis'],
      tags: ['beginner', 'form check'],
      createdAt: new Date('2025-01-09'),
    },
  });

  await prisma.analysis.create({
    data: {
      userId: athlete4.id,
      uploadedByCoachId: coach2.id,
      videoFileName: 'emily_marathon_pace.mp4',
      videoFileSize: 73400320,
      videoDuration: 90,
      status: AnalysisStatus.COMPLETED,
      cadence: 178,
      strideLength: 1.32,
      verticalOscillation: 6.8,
      groundContactTime: 225,
      footStrike: 'Midfoot',
      performanceScore: 83,
      injuryRiskScore: 18,
      aiInsights: 'Marathon-ready form. Excellent efficiency for long distance.',
      recommendations: ['Maintain form during fatigue', 'Practice race pace segments'],
      tags: ['marathon training', 'race prep'],
      createdAt: new Date('2025-01-12'),
    },
  });

  console.log('📊 Sample analyses created');

  // ===========================================
  // CREATE NOTIFICATIONS
  // ===========================================

  await prisma.notification.create({
    data: {
      userId: coach1.id,
      type: 'ANALYSIS_COMPLETE',
      title: 'Analysis Complete',
      message: 'Analysis for Mike Johnson has been completed',
      metadata: { analysisId: 'sample', athleteName: 'Mike Johnson' },
      createdAt: new Date('2025-01-09'),
    },
  });

  await prisma.notification.create({
    data: {
      userId: athlete1.id,
      type: 'NEW_ANALYSIS',
      title: 'New Analysis Available',
      message: 'Your coach has uploaded a new analysis for you',
      metadata: { coachName: 'Robert Wilson' },
      createdAt: new Date('2025-01-09'),
    },
  });

  await prisma.notification.create({
    data: {
      userId: individual2.id,
      type: 'SUBSCRIPTION_EXPIRING',
      title: 'Subscription Renewal',
      message: 'Your PRO subscription will renew in 3 days',
      isRead: true,
      createdAt: new Date('2025-01-10'),
    },
  });

  console.log('🔔 Sample notifications created');

  // ===========================================
  // CREATE ACTIVITY LOGS
  // ===========================================

  const users = [individual1, individual2, coach1, coach2, athlete1];
  for (const user of users) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2025-01-14'),
      },
    });
  }

  console.log('📝 Activity logs created');

  // ===========================================
  // SUMMARY
  // ===========================================

  const summary = await prisma.user.groupBy({
    by: ['accountType'],
    _count: true,
  });

  console.log('\n📊 Database Seed Summary:');
  console.log('========================');
  summary.forEach(item => {
    console.log(`${item.accountType}: ${item._count} users`);
  });

  const totalAnalyses = await prisma.analysis.count();
  console.log(`Total Analyses: ${totalAnalyses}`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n🔑 Test Credentials:');
  console.log('========================');
  console.log('Admin:');
  console.log('  Email: admin@runform.com');
  console.log('  Password: Admin123!');
  console.log('\nCoach (Basic Plan):');
  console.log('  Email: coach.wilson@example.com');
  console.log('  Password: Coach123!');
  console.log('\nCoach (Pro Plan):');
  console.log('  Email: coach.martinez@example.com');
  console.log('  Password: Coach123!');
  console.log('\nIndividual (Free Plan):');
  console.log('  Email: john.runner@example.com');
  console.log('  Password: Runner123!');
  console.log('\nIndividual (Pro Plan):');
  console.log('  Email: sarah.athlete@example.com');
  console.log('  Password: Athlete123!');
  console.log('\nLimited Athlete (Coach-created):');
  console.log('  Email: mike.athlete@example.com');
  console.log('  Password: TempPass123!');
  console.log('\nUpgraded Athlete (Was limited, now Individual):');
  console.log('  Email: david.brown@example.com');
  console.log('  Password: TempPass123!');
  console.log('========================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });