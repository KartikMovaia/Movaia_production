// frontend/src/shared/services/coach.service.ts

import { apiService } from './api.service';
import { User } from '../types/user.types';

export interface Athlete extends User {
  stats: {
    totalAnalyses: number;
    lastAnalysisDate: string | null;
  };
}

export interface CreateAthleteData {
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

export interface CoachStats {
  totalAthletes: number;
  totalAnalyses: number;
  completedAnalyses: number;
  processingAnalyses: number;
  recentAnalyses: any[];
}

class CoachService {
  /**
   * Get all athletes managed by coach
   */
  async getAthletes(): Promise<Athlete[]> {
    const response = await apiService.get('/coach/athletes');
    return response.data.athletes;
  }

  /**
   * Get a specific athlete by ID
   */
  async getAthlete(athleteId: string): Promise<Athlete> {
    const response = await apiService.get(`/coach/athletes/${athleteId}`);
    return response.data.athlete;
  }

  /**
   * Create a new athlete (coach-created account)
   */
  async createAthlete(data: CreateAthleteData): Promise<{ athlete: User; tempPassword: string }> {
    const response = await apiService.post('/coach/athletes', data);
    return response.data;
  }

  /**
   * Update athlete profile
   */
  async updateAthlete(athleteId: string, data: Partial<CreateAthleteData>): Promise<User> {
    const response = await apiService.put(`/coach/athletes/${athleteId}`, data);
    return response.data.athlete;
  }

  /**
   * Reset athlete password
   */
  async resetAthletePassword(athleteId: string): Promise<string> {
    const response = await apiService.post(`/coach/athletes/${athleteId}/reset-password`);
    return response.data.tempPassword;
  }

  /**
   * Remove/Disconnect athlete
   */
  async removeAthlete(athleteId: string): Promise<void> {
    await apiService.delete(`/coach/athletes/${athleteId}`);
  }

  /**
   * Get analyses for a specific athlete
   */
  async getAthleteAnalyses(athleteId: string, page: number = 1, limit: number = 10) {
    const response = await apiService.get(
      `/coach/athletes/${athleteId}/analyses?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Get all analyses for all athletes (coach dashboard)
   */
  async getAllAthletesAnalyses(filters?: {
    athleteId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.athleteId) params.append('athleteId', filters.athleteId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiService.get(`/coach/analyses?${params.toString()}`);
    return response.data;
  }

  /**
   * Invite existing Movaia user as athlete
   */
  async inviteAthlete(athleteEmail: string) {
    const response = await apiService.post('/coach/invite-athlete', { athleteEmail });
    return response.data;
  }

  /**
   * Get coach statistics
   */
  async getCoachStats(): Promise<CoachStats> {
    const response = await apiService.get('/coach/stats');
    return response.data.stats;
  }
}

export const coachService = new CoachService();