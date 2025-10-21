// backend/src/modules/analysis/services/analysis.service.ts
import axios from 'axios';
import { PrismaClient, AnalysisStatus } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const prisma = new PrismaClient();
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const EC2_API_URL = process.env.EC2_API_URL || 'http://ec2-instance-url:5001';
const BACKEND_WEBHOOK_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export class AnalysisService {
  /**
   * Trigger analysis on EC2 instance
   * SUPPORTS ALL FOUR VIDEO TYPES: normal, left_to_right, right_to_left, rear_view
   */
  async triggerAnalysis(analysisId: string): Promise<void> {
    try {
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: { user: true }  
      });

      if (!analysis) {
        throw new Error('Analysis not found');
      }

      if (!analysis.videoUrl) {
        throw new Error('Normal speed video is required');
      }

      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: AnalysisStatus.PROCESSING },
      });

      // Prepare video URLs for EC2 - ALL FOUR VIDEO TYPES
      const videos: any = {
        normal: null,
        leftToRight: null,
        rightToLeft: null,
        rearView: null
      };

      // Generate presigned URLs for each video
      if (analysis.videoUrl) {
        const normalKey = analysis.videoUrl.split('.amazonaws.com/')[1];
        videos.normal = await this.generatePresignedUrl(normalKey);
      }

      if (analysis.videoLeftToRightUrl) {
        const leftKey = analysis.videoLeftToRightUrl.split('.amazonaws.com/')[1];
        videos.leftToRight = await this.generatePresignedUrl(leftKey);
      }

      if (analysis.videoRightToLeftUrl) {
        const rightKey = analysis.videoRightToLeftUrl.split('.amazonaws.com/')[1];
        videos.rightToLeft = await this.generatePresignedUrl(rightKey);
      }

      // Handle rear-view video
      if (analysis.videoRearViewUrl) {
        const rearKey = analysis.videoRearViewUrl.split('.amazonaws.com/')[1];
        videos.rearView = await this.generatePresignedUrl(rearKey);
      }

      const response = await axios.post(`${EC2_API_URL}/api/analyze`, {
        analysisId,
        videos,
        userId: analysis.user.id,
        webhookUrl: `${BACKEND_WEBHOOK_URL}/api/analysis/webhook`,
      });

      console.log('EC2 Analysis triggered:', response.data);
    } catch (error) {
      console.error('Failed to trigger analysis:', error);

      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: AnalysisStatus.FAILED },
      });

      throw error;
    }
  }

  /**
   * Handle webhook from EC2 with analysis results
   * HANDLES RESULTS FROM ALL VIDEO TYPES
   */
  async handleAnalysisComplete(data: {
    analysisId: string;
    userId: string;
    status: 'completed' | 'failed';
    error?: string;
    videoType?: string;
  }): Promise<void> {
    try {
      const { analysisId, status, error } = data;

      if (status === 'failed') {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { status: AnalysisStatus.FAILED },
        });
        return;
      }

      // Generate thumbnail URL (from normal video)
      const baseKey = `analysis_result/${data.userId}/${analysisId}`;
      const normalFolder = `${baseKey}/normal`;
      const thumbnailKey = `${normalFolder}/input_video_normal-FULL-L.png`;
      const thumbnailUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;

      // Update status and thumbnail URL
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { 
          status: AnalysisStatus.COMPLETED,
          thumbnailUrl: thumbnailUrl
        },
      });

      // Send notification
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: { user: true },
      });

      if (analysis) {
        await prisma.notification.create({
          data: {
            userId: analysis.userId,
            type: 'ANALYSIS_COMPLETE',
            title: 'Analysis Complete',
            message: 'Your running form analysis is ready!',
            metadata: { analysisId },
          },
        });
      }
    } catch (error) {
      console.error('Failed to handle analysis completion:', error);
      throw error;
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysis(analysisId: string, userId: string): Promise<any> {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        OR: [
          { userId },
          { uploadedByCoachId: userId },
        ],
      },
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Generate presigned URL for thumbnail if it exists
    if (analysis.status === AnalysisStatus.COMPLETED) {
      const baseKey = `analysis_result/${analysis.userId}/${analysisId}`;
      const thumbnailKey = `${baseKey}/normal/input_video_normal-FULL-L.png`;
      
      try {
        const thumbnailUrl = await this.generatePresignedUrl(thumbnailKey);
        return {
          ...analysis,
          thumbnailPresignedUrl: thumbnailUrl
        };
      } catch (error) {
        console.log('Thumbnail not found:', error);
      }
    }

    return analysis;
  }

  /**
   * Get user's analyses with thumbnail URLs and metrics classification
   */
  async getUserAnalyses(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: AnalysisStatus
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = {
      OR: [
        { userId },
        { uploadedByCoachId: userId },
      ],
    };

    if (status) {
      where.status = status;
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
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    // Generate presigned URLs for thumbnails and get metrics classification
    const analysesWithEnhancedData = await Promise.all(
      analyses.map(async (analysis) => {
        const result: any = { ...analysis };
        
        if (analysis.status === AnalysisStatus.COMPLETED) {
          const baseKey = `analysis_result/${analysis.userId}/${analysis.id}`;
          
          // Get thumbnail from normal video
          const thumbnailKey = `${baseKey}/normal/input_video_normal-FULL-L.png`;
          try {
            const thumbnailUrl = await this.generatePresignedUrl(thumbnailKey);
            result.thumbnailPresignedUrl = thumbnailUrl;
          } catch (error) {
            // Thumbnail might not exist
          }
          
          // Get metrics classification from normal video results
          const normalResultsKey = `${baseKey}/normal/results.csv`;
          try {
            const resultsUrl = await this.generatePresignedUrl(normalResultsKey);
            if (resultsUrl) {
              const classification = await this.getMetricsClassification(resultsUrl);
              result.metricsClassification = classification;
            }
          } catch (error) {
            console.log('Could not get metrics classification:', error);
          }
        }
        return result;
      })
    );

    return {
      analyses: analysesWithEnhancedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get metrics classification from results CSV
   */
  private async getMetricsClassification(resultsUrl: string): Promise<any> {
    try {
      const response = await axios.get(resultsUrl);
      const csvText = response.data;
      
      return this.classifyMetricsFromCSV(csvText);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Failed to get metrics classification:', error.message || error);
      return null;
    }
  }

  /**
   * Classify metrics based on CSV data
   */
  private classifyMetricsFromCSV(csvData: string): any {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return null;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const values = lines[1].split(',').map(v => v.trim());
    
    let idealCount = 0;
    let workableCount = 0;
    let checkCount = 0;
    
    const metricChecks = [
      { headers: ['msa-l', 'msa-r'], workable: [8, 30] },
      { headers: ['sat-l', 'sat-r'], workable: [0, 10], ideal: [1, 7] },
      { headers: ['sweep-l', 'sweep-r'], workable: [4, 25] },
      { headers: ['step_rate'], workable: [154, 192], ideal: [163, 184] },
      { headers: ['golden_ratio-l', 'golden_ratio-r'], workable: [0.65, 0.80], ideal: [0.70, 0.75] },
      { headers: ['fat-l', 'fat-r'], workable: [-15, 15], ideal: [-5, 5] },
      { headers: ['lean-l', 'lean-r'], workable: [2, 8], ideal: [3, 6] },
      { headers: ['arm_angle-l', 'arm_angle-r'], workable: [40, 90], ideal: [45, 80] },
      { headers: ['arm_movement_back-l', 'arm_movement_back-r'], workable: [-2, 2] },
      { headers: ['arm_movement_forward-l', 'arm_movement_forward-r'], workable: [-2, 2] },
      { headers: ['posture-l', 'posture-r'], workable: [-15, 25], ideal: [-2, 10] },
      { headers: ['ground_contact_time-l', 'ground_contact_time-r'], workable: [0.20, 0.30], ideal: [0, 0.20] },
      { headers: ['vertical_osc-l', 'vertical_osc-r'], workable: [0.025, 0.060] },
      { headers: ['step_width-l', 'step_width-r'], workable: [0.4, 1.0] },
      { headers: ['col_pelvic_drop-l', 'col_pelvic_drop-r'], workable: [4, 6], ideal: [2, 4] },
    ];
    
    metricChecks.forEach(metric => {
      metric.headers.forEach(header => {
        const index = headers.indexOf(header);
        if (index !== -1 && values[index]) {
          const value = parseFloat(values[index]);
          if (!isNaN(value)) {
            if (metric.ideal && value >= metric.ideal[0] && value <= metric.ideal[1]) {
              idealCount++;
            } else if (value >= metric.workable[0] && value <= metric.workable[1]) {
              workableCount++;
            } else {
              checkCount++;
            }
          }
        }
      });
    });
    
    return {
      ideal: idealCount,
      workable: workableCount,
      check: checkCount
    };
  }

  /**
   * Get analysis files - RETURNS FILES FROM ALL FOUR VIDEO FOLDERS
   * Supports: normal, left_to_right, right_to_left, rear_view
   */
  async getAnalysisFiles(analysisId: string, userId: string): Promise<any> {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId: userId
      }
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    const baseKey = `analysis_result/${userId}/${analysisId}`;
    
    /**
     * Helper function to get all visualization PNGs for a video type
     * @param folder - S3 folder name (normal, left_to_right, right_to_left, rear_view)
     * @param videoType - Video type identifier for filename construction
     */
    const getVisualizationPNGs = async (folder: string, videoType: string) => {
      const videoPrefix = `input_video_${videoType}`;
      
      const pngCategories = {
        fullBody: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-FULL-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-FULL-R.png`)
        },
        footAngle: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-FAT-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-FAT-R.png`)
        },
        toeOff: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-TOF-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-TOF-R.png`)
        },
        shinAngle: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-SAT-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-SAT-R.png`)
        },
        midStanceAngle: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-MSA-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-MSA-R.png`)
        },
        armMovement: {
          front: {
            left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-AMF-L.png`),
            right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-AMF-R.png`)
          },
          back: {
            left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-AMB-L.png`),
            right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-AMB-R.png`)
          }
        },
        armAngle: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-ARA-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-ARA-R.png`)
        },
        leanVerticalOscillation: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-LENVOP-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-LENVOP-R.png`)
        },
        lean: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-LEN-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-LEN-R.png`)
        },
        pelvicDrop: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-CPD-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-CPD-R.png`)
        },
        stepWidth: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-STW-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-STW-R.png`)
        },
        posture: {
          left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-PST-L.png`),
          right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-PST-R.png`)
        },
        pelvisMinMax: {
          min: {
            left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-PLSMIN-L.png`),
            right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-PLSMIN-R.png`)
          },
          max: {
            left: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-PLSMAX-L.png`),
            right: await this.generatePresignedUrl(`${baseKey}/${folder}/${videoPrefix}-PLSMAX-R.png`)
          }
        }
      };

      return pngCategories;
    };

    // Files from normal video (always present)
    const normalFiles = {
      resultsCSV: await this.generatePresignedUrl(`${baseKey}/normal/results.csv`),
      visualizationVideo: await this.generatePresignedUrl(`${baseKey}/normal/visualization.mp4`),
      frameByFrameCSV: await this.generatePresignedUrl(`${baseKey}/normal/frame_by_frame.csv`),
      thumbnail: await this.generatePresignedUrl(`${baseKey}/normal/input_video_normal-FULL-L.png`),
      visualizations: await getVisualizationPNGs('normal', 'normal')
    };

    // Files from left-to-right video (if exists)
    let leftToRightFiles = null;
    if (analysis.leftToRightVideoUploaded) {
      leftToRightFiles = {
        resultsCSV: await this.generatePresignedUrl(`${baseKey}/left_to_right/results.csv`),
        visualizationVideo: await this.generatePresignedUrl(`${baseKey}/left_to_right/visualization.mp4`),
        frameByFrameCSV: await this.generatePresignedUrl(`${baseKey}/left_to_right/frame_by_frame.csv`),
        thumbnail: await this.generatePresignedUrl(`${baseKey}/left_to_right/input_video_left_to_right-FULL-L.png`),
        visualizations: await getVisualizationPNGs('left_to_right', 'left_to_right')
      };
    }

    // Files from right-to-left video (if exists)
    let rightToLeftFiles = null;
    if (analysis.rightToLeftVideoUploaded) {
      rightToLeftFiles = {
        resultsCSV: await this.generatePresignedUrl(`${baseKey}/right_to_left/results.csv`),
        visualizationVideo: await this.generatePresignedUrl(`${baseKey}/right_to_left/visualization.mp4`),
        frameByFrameCSV: await this.generatePresignedUrl(`${baseKey}/right_to_left/frame_by_frame.csv`),
        thumbnail: await this.generatePresignedUrl(`${baseKey}/right_to_left/input_video_right_to_left-FULL-L.png`),
        visualizations: await getVisualizationPNGs('right_to_left', 'right_to_left')
      };
    }

    // Files from rear-view video (if exists)
    let rearViewFiles = null;
    if (analysis.rearViewVideoUploaded) {
      rearViewFiles = {
        resultsCSV: await this.generatePresignedUrl(`${baseKey}/rear_view/results.csv`),
        visualizationVideo: await this.generatePresignedUrl(`${baseKey}/rear_view/visualization.mp4`),
        frameByFrameCSV: await this.generatePresignedUrl(`${baseKey}/rear_view/frame_by_frame.csv`),
        thumbnail: await this.generatePresignedUrl(`${baseKey}/rear_view/input_video_rear_view-FULL-L.png`),
        visualizations: await getVisualizationPNGs('rear_view', 'rear_view')
      };
    }

    return {
      analysis,
      files: {
        normal: normalFiles,
        leftToRight: leftToRightFiles,
        rightToLeft: rightToLeftFiles,
        rearView: rearViewFiles
      }
    };
  }

  private async generatePresignedUrl(key: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      return null;
    }
  }
}

export const analysisService = new AnalysisService();