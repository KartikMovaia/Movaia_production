// backend/src/controllers/video.controller.ts
import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const analysisService = require('../../analysis/services/analysis.service').analysisService;

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'movaia-videos';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// Video type enum
export type VideoType = 'normal' | 'left_to_right' | 'right_to_left';

/**
 * Generate presigned URL for direct S3 upload
 * NOW ACCEPTS VIDEO TYPE
 */
export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType, videoType, analysisId } = req.body;
    const userId = req.currentUser?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!fileName || !fileType || !videoType) {
      res.status(400).json({ error: 'fileName, fileType, and videoType are required' });
      return;
    }

    // Validate video type
    if (!['normal', 'left_to_right', 'right_to_left'].includes(videoType)) {
      res.status(400).json({ error: 'Invalid video type' });
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!allowedTypes.includes(fileType)) {
      res.status(400).json({ error: 'Invalid file type. Only MP4, MOV, AVI, and MKV are allowed.' });
      return;
    }

    // Generate unique key for S3 with video type folder
    const fileExtension = fileName.split('.').pop();
    const videoTypeFolder = videoType === 'normal' ? 'normal' : 
                           videoType === 'left_to_right' ? 'left_to_right' : 'right_to_left';
    
    // If analysisId provided, use it; otherwise generate new one
    const finalAnalysisId = analysisId || uuidv4();
    
    const key = `videos/${userId}/${finalAnalysisId}/${videoTypeFolder}/${uuidv4()}.${fileExtension}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        userId,
        analysisId: finalAnalysisId,
        videoType,
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

    res.json({
      uploadUrl,
      key,
      analysisId: finalAnalysisId,
      videoType,
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Get upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

/**
 * Confirm video upload and create/update analysis record
 * NOW HANDLES MULTIPLE VIDEO TYPES
 */
export const confirmUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { key, videoType, analysisId, athleteId, notes, tags, isComplete } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!analysisId) {
      res.status(400).json({ error: 'analysisId is required' });
      return;
    }

    // If isComplete is true and key is empty, user is just triggering analysis (not uploading)
    if (isComplete && (!key || key === '')) {
      // Just trigger analysis on existing uploads
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId }
      });

      if (!analysis) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      if (!analysis.normalVideoUploaded) {
        res.status(400).json({ 
          error: 'Cannot start analysis without normal speed video',
          analysis 
        });
        return;
      }

      // Update status to PENDING and trigger analysis
      const updatedAnalysis = await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'PENDING' },
        select: {
          id: true,
          userId: true,
          videoUrl: true,
          videoLeftToRightUrl: true,
          videoRightToLeftUrl: true,
          status: true,
          normalVideoUploaded: true,
          leftToRightVideoUploaded: true,
          rightToLeftVideoUploaded: true,
          createdAt: true,
        },
      });

      // Trigger analysis
      await analysisService.triggerAnalysis(analysisId);

      // Update usage record
      const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
      await prisma.usageRecord.upsert({
        where: {
          userId_month: {
            userId: userId,
            month: currentMonth,
          },
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          userId: userId,
          month: currentMonth,
          count: 1,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'START_ANALYSIS',
          entityType: 'Analysis',
          entityId: analysisId,
          metadata: { athleteId },
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
        },
      });

      res.json({
        message: 'Analysis started successfully',
        analysis: updatedAnalysis,
        analysisTriggered: true,
      });
      return;
    }

    // Normal flow: uploading a video (key must be present)
    if (!key || key === '') {
      res.status(400).json({ error: 'S3 key is required for video upload' });
      return;
    }

    if (!videoType) {
      res.status(400).json({ error: 'videoType is required for video upload' });
      return;
    }

    // Validate video type
    if (!['normal', 'left_to_right', 'right_to_left'].includes(videoType)) {
      res.status(400).json({ error: 'Invalid video type' });
      return;
    }

    // Determine who the analysis is for
    let analysisUserId = userId;
    let uploadedByCoachId = null;

    // If coach is uploading for an athlete
    if (athleteId && req.currentUser?.accountType === 'COACH') {
      const athlete = await prisma.user.findFirst({
        where: {
          id: athleteId,
          createdByCoachId: userId,
        },
      });

      if (!athlete) {
        res.status(403).json({ error: 'Athlete not found or not managed by you' });
        return;
      }

      analysisUserId = athleteId;
      uploadedByCoachId = userId;
    }

    // Build video URL
    const videoUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    const videoFileName = key.split('/').pop() || 'video.mp4';

    // Check if analysis already exists
    const existingAnalysis = await prisma.analysis.findUnique({
      where: { id: analysisId }
    });

    let analysis;

    if (existingAnalysis) {
      // Update existing analysis with new video
      const updateData: any = {};
      
      if (videoType === 'normal') {
        updateData.videoUrl = videoUrl;
        updateData.videoFileName = videoFileName;
        updateData.normalVideoUploaded = true;
      } else if (videoType === 'left_to_right') {
        updateData.videoLeftToRightUrl = videoUrl;
        updateData.videoLeftToRightFileName = videoFileName;
        updateData.leftToRightVideoUploaded = true;
      } else if (videoType === 'right_to_left') {
        updateData.videoRightToLeftUrl = videoUrl;
        updateData.videoRightToLeftFileName = videoFileName;
        updateData.rightToLeftVideoUploaded = true;
      }

      // If this is the last video (isComplete flag), set status to PENDING
      if (isComplete) {
        updateData.status = 'PENDING';
      }

      analysis = await prisma.analysis.update({
        where: { id: analysisId },
        data: updateData,
        select: {
          id: true,
          userId: true,
          videoUrl: true,
          videoLeftToRightUrl: true,
          videoRightToLeftUrl: true,
          status: true,
          normalVideoUploaded: true,
          leftToRightVideoUploaded: true,
          rightToLeftVideoUploaded: true,
          createdAt: true,
        },
      });
    } else {
      // Create new analysis record
      const createData: any = {
        id: analysisId,
        userId: analysisUserId,
        uploadedByCoachId,
        status: 'DRAFT', // Start as DRAFT until all videos uploaded
        notes,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        videoFileName: videoFileName, // Set a default filename
      };

      if (videoType === 'normal') {
        createData.videoUrl = videoUrl;
        createData.videoFileName = videoFileName;
        createData.normalVideoUploaded = true;
      } else if (videoType === 'left_to_right') {
        createData.videoLeftToRightUrl = videoUrl;
        createData.videoLeftToRightFileName = videoFileName;
        createData.leftToRightVideoUploaded = true;
      } else if (videoType === 'right_to_left') {
        createData.videoRightToLeftUrl = videoUrl;
        createData.videoRightToLeftFileName = videoFileName;
        createData.rightToLeftVideoUploaded = true;
      }

      // If only normal video and isComplete, set to PENDING
      if (isComplete && videoType === 'normal') {
        createData.status = 'PENDING';
      }

      analysis = await prisma.analysis.create({
        data: createData,
        select: {
          id: true,
          userId: true,
          videoUrl: true,
          videoLeftToRightUrl: true,
          videoRightToLeftUrl: true,
          status: true,
          normalVideoUploaded: true,
          leftToRightVideoUploaded: true,
          rightToLeftVideoUploaded: true,
          createdAt: true,
        },
      });
    }

    // Trigger analysis only if marked as complete AND normal video exists
    if (isComplete && analysis.normalVideoUploaded) {
      await analysisService.triggerAnalysis(analysis.id);

      // Update usage record for the current month
      const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
      await prisma.usageRecord.upsert({
        where: {
          userId_month: {
            userId: userId,
            month: currentMonth,
          },
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          userId: userId,
          month: currentMonth,
          count: 1,
        },
      });
    } else if (isComplete && !analysis.normalVideoUploaded) {
      // If user tries to start analysis without normal video
      res.status(400).json({ 
        error: 'Cannot start analysis without normal speed video',
        analysis 
      });
      return;
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPLOAD_VIDEO',
        entityType: 'Analysis',
        entityId: analysis.id,
        metadata: { key, videoType, athleteId, isComplete },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: `Video uploaded successfully (${videoType})`,
      analysis,
      analysisTriggered: isComplete && analysis.normalVideoUploaded,
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
};

/**
 * Get user's analyses
 */
export const getUserAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // For coaches, show their own analyses and those they uploaded
    if (req.currentUser?.accountType === 'COACH') {
      where.OR = [
        { userId },
        { uploadedByCoachId: userId },
      ];
    } else {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [analyses, total] = await prisma.$transaction([
      prisma.analysis.findMany({
        where,
        skip,
        take: Number(limit),
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

    res.json({
      analyses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Get user analyses error:', error);
    res.status(500).json({ error: 'Failed to get analyses' });
  }
};

/**
 * Delete analysis
 */
export const deleteAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { analysisId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check ownership
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
      res.status(404).json({ error: 'Analysis not found or you do not have permission' });
      return;
    }

    // Delete from database
    await prisma.analysis.delete({
      where: { id: analysisId },
    });

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
};