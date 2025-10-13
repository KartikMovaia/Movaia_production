// frontend/src/services/video.service.ts

import { apiService } from './api.service';

export type VideoType = 'normal' | 'left_to_right' | 'right_to_left';

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  analysisId: string;
  videoType: VideoType;
  expires: string;
}

export interface ConfirmUploadResponse {
  message: string;
  analysis: {
    id: string;
    userId: string;
    videoUrl: string;
    videoFileName: string;
    status: string;
    createdAt: string;
    normalVideoUploaded?: boolean;
    leftToRightVideoUploaded?: boolean;
    rightToLeftVideoUploaded?: boolean;
  };
  analysisTriggered?: boolean;
}

class VideoService {
  /**
   * Get presigned URL for direct S3 upload
   * NOW SUPPORTS VIDEO TYPE AND ANALYSIS ID
   */
  async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    videoType: VideoType = 'normal',
    analysisId?: string
  ): Promise<PresignedUrlResponse> {
    const response = await apiService.post<PresignedUrlResponse>(
      '/videos/upload-url',
      {
        fileName,
        fileType,
        videoType,
        analysisId // Pass existing analysisId if we have one
      }
    );
    return response.data;
  }

  /**
   * Upload directly to S3 using presigned URL
   */
  async uploadToS3(url: string, file: File): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3 upload error:', errorText);
      throw new Error('Failed to upload to S3');
    }
  }

  /**
   * Confirm upload completion
   * NOW SUPPORTS VIDEO TYPE AND ANALYSIS ID
   */
  async confirmUpload(
    key: string,
    videoType: VideoType,
    analysisId: string,
    athleteId?: string,
    isComplete: boolean = false,
    notes?: string,
    tags?: string[]
  ): Promise<ConfirmUploadResponse> {
    const response = await apiService.post<ConfirmUploadResponse>(
      '/videos/confirm-upload',
      {
        key,
        videoType,
        analysisId,
        athleteId,
        isComplete, // Flag to indicate if all uploads are done and ready for analysis
        notes,
        tags
      }
    );
    return response.data;
  }

  /**
   * Get user's analyses
   */
  async getUserAnalyses(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) {
      params.append('status', status);
    }

    const response = await apiService.get(`/videos/analyses?${params.toString()}`);
    return response.data;
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    await apiService.delete(`/videos/analysis/${analysisId}`);
  }
}

export const videoService = new VideoService();