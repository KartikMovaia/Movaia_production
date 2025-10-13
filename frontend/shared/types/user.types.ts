// src/types/user.types.ts

export enum AccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  COACH = 'COACH',
  ATHLETE_LIMITED = 'ATHLETE_LIMITED',
  ADMIN = 'ADMIN'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  INDIVIDUAL_BASIC = 'INDIVIDUAL_BASIC',
  INDIVIDUAL_PRO = 'INDIVIDUAL_PRO',
  COACH_BASIC = 'COACH_BASIC',
  COACH_PRO = 'COACH_PRO',
  COACH_UNLIMITED = 'COACH_UNLIMITED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: AccountType;
  subscriptionPlan?: SubscriptionPlan;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isUpgraded?: boolean;
  mustChangePassword?: boolean;
  requirePasswordChange?: boolean; // alias for mustChangePassword
  profileImage?: string | null;
  
  // Profile/Onboarding fields - ADD THESE
  primaryGoal?: string | null;
  injuryHistory?: string[] | null;
  gender?: string | null;
  unitPreference?: string | null;
  height?: number | null;
  weight?: number | null;
  runningExperience?: string | null;
  weeklyMileage?: number | null;
  preferredDistance?: string | null;
  dateOfBirth?: string | null;
  personalBest?: {
    distance: number;
    time: string;
    unit: string;
  } | null;
  phoneNumber?: string | null;
  bio?: string | null;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  
  // Relations
  coachId?: string | null;
  createdByCoach?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  subscription?: {
    plan: SubscriptionPlan;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
  managedAthletes?: User[];
  stats?: UserStats;
}

export interface UserStats {
  totalAnalyses: number;
  totalAthletes?: number;
  monthlyUsage: number;
  lastAnalysisDate?: string | null;
}

export interface CreateAthleteRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface UpdateAthleteRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

export interface AthleteWithStats extends User {
  stats: UserStats;
}

// Add this interface for the registration data structure
export interface RunningProfile {
  primaryGoal?: string | null;
  injuryHistory?: string[];
  preferredDistance?: string | null;
  unitPreference?: 'metric' | 'imperial' | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs';
  dateOfBirth?: string | null;
  personalBest?: {
    distance: number | null;
    time: string | null;
    unit: string;
  } | null;
}