// frontend/src/services/analysis.service.ts
import { apiService } from './api.service';

export interface MetricsClassification {
  ideal: number;
  workable: number;
  check: number;
}

export interface VisualizationPNGs {
  fullBody: {
    left: string | null;
    right: string | null;
  };
  footAngle: {
    left: string | null;
    right: string | null;
  };
  toeOff: {
    left: string | null;
    right: string | null;
  };
  shinAngle: {
    left: string | null;
    right: string | null;
  };
  midStanceAngle: {
    left: string | null;
    right: string | null;
  };
  armMovement: {
    front: {
      left: string | null;
      right: string | null;
    };
    back: {
      left: string | null;
      right: string | null;
    };
  };
  armAngle: {
    left: string | null;
    right: string | null;
  };
  leanVerticalOscillation: {
    left: string | null;
    right: string | null;
  };
  lean: {
    left: string | null;
    right: string | null;
  };
  pelvicDrop: {
    left: string | null;
    right: string | null;
  };
  stepWidth: {
    left: string | null;
    right: string | null;
  };
  posture: {
    left: string | null;
    right: string | null;
  };
  pelvisMinMax: {
    min: {
      left: string | null;
      right: string | null;
    };
    max: {
      left: string | null;
      right: string | null;
    };
  };
}


export interface Analysis {
  id: string;
  userId: string;
  
  // Normal video (required)
  videoUrl: string;
  videoFileName: string;
  
  // Left-to-right video (optional)
  videoLeftToRightUrl?: string;
  videoLeftToRightFileName?: string;
  
  // Right-to-left video (optional)
  videoRightToLeftUrl?: string;
  videoRightToLeftFileName?: string;
  
  status: 'DRAFT' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  
  // Upload status flags
  normalVideoUploaded?: boolean;
  leftToRightVideoUploaded?: boolean;
  rightToLeftVideoUploaded?: boolean;
  
  // Thumbnail and metrics
  thumbnailUrl?: string; // S3 URL stored in DB
  thumbnailPresignedUrl?: string; // Presigned URL for access
  metricsClassification?: MetricsClassification; // Metrics classification data
  
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AnalysisListResponse {
  analyses: Analysis[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AnalysisFiles {
  resultsCSV: string | null;
  visualizationVideo: string | null;
  frameByFrameCSV: string | null;
  thumbnail: string | null;
}

export interface MultiVideoAnalysisFiles {
  normal: AnalysisFiles;
  leftToRight: AnalysisFiles | null;
  rightToLeft: AnalysisFiles | null;
}

class AnalysisService {
  /**
   * Get a specific analysis by ID
   */
  async getAnalysis(analysisId: string): Promise<Analysis> {
    const response = await apiService.get<{ analysis: Analysis }>(
      `/analysis/${analysisId}`
    );
    return response.data.analysis;
  }

  /**
   * Get analysis with all file URLs
   * NOW RETURNS FILES FROM ALL THREE VIDEO TYPES
   */
  async getAnalysisWithFiles(analysisId: string): Promise<{
    analysis: Analysis;
    files: MultiVideoAnalysisFiles;
  }> {
    const response = await apiService.get(`/analysis/${analysisId}/files`);
    return response.data;
  }

  /**
   * Get paginated list of user analyses
   */
  async getUserAnalyses(
    page: number = 1,
    limit: number = 10,
    status?: string,
    userId?: string // Optional for coaches viewing athlete analyses
  ): Promise<AnalysisListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (userId) params.append('userId', userId);

    const response = await apiService.get<AnalysisListResponse>(
      `/analysis/list?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Trigger analysis for a specific analysis ID
   */
  async triggerAnalysis(analysisId: string): Promise<{ message: string; analysisId: string }> {
    const response = await apiService.post<{ message: string; analysisId: string }>(
      '/analysis/trigger',
      { analysisId }
    );
    return response.data;
  }

  /**
   * Poll for analysis status updates
   */
  async pollAnalysisStatus(
    analysisId: string,
    onUpdate?: (analysis: Analysis) => void,
    maxAttempts: number = 60,
    interval: number = 5000
  ): Promise<Analysis> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const analysis = await this.getAnalysis(analysisId);

          if (onUpdate) {
            onUpdate(analysis);
          }

          if (analysis.status === 'COMPLETED' || analysis.status === 'FAILED') {
            resolve(analysis);
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Analysis timeout - maximum polling attempts reached'));
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Helper to check if analysis has multiple videos
   */
  hasMultipleVideos(analysis: Analysis): boolean {
    return !!(analysis.leftToRightVideoUploaded || analysis.rightToLeftVideoUploaded);
  }

  /**
   * Get count of uploaded videos
   */
  getUploadedVideoCount(analysis: Analysis): number {
    let count = 0;
    if (analysis.normalVideoUploaded) count++;
    if (analysis.leftToRightVideoUploaded) count++;
    if (analysis.rightToLeftVideoUploaded) count++;
    return count;
  }
}

export const analysisService = new AnalysisService();