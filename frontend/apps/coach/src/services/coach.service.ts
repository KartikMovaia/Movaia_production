// src/services/coach.service.ts

import { apiService } from '../../../../shared/services/api.service';
import {
  User,
  CreateAthleteRequest,
  UpdateAthleteRequest,
  AthleteWithStats,
} from '../../../../shared/types/user.types';

interface CreateAthleteResponse {
  athlete: User;
  temporaryPassword: string;
}

class CoachService {
  async createAthlete(data: CreateAthleteRequest): Promise<CreateAthleteResponse> {
    const response = await apiService.post('/coach/athletes', data);
    // Backend returns { athlete: {...}, tempPassword: "..." }
    return {
      athlete: response.data.athlete,
      temporaryPassword: response.data.tempPassword
    };
  }

  async getAthletes(): Promise<AthleteWithStats[]> {
    const response = await apiService.get('/coach/athletes');
    // Backend returns { athletes: [...], total: number }
    return response.data.athletes || [];
  }

  async getAthlete(id: string): Promise<AthleteWithStats> {
    const response = await apiService.get(`/coach/athletes/${id}`);
    // Backend returns { athlete: {...} }
    return response.data.athlete;
  }

  async updateAthlete(id: string, data: UpdateAthleteRequest): Promise<User> {
    const response = await apiService.put(`/coach/athletes/${id}`, data);
    // Backend returns { message: "...", athlete: {...} }
    return response.data.athlete;
  }

  async resetAthletePassword(id: string): Promise<{ temporaryPassword: string }> {
    const response = await apiService.post(`/coach/athletes/${id}/reset-password`);
    // Backend returns { tempPassword: "..." }
    return {
      temporaryPassword: response.data.tempPassword
    };
  }

  async deleteAthlete(id: string): Promise<void> {
    await apiService.delete(`/coach/athletes/${id}`);
  }
}

export const coachService = new CoachService();