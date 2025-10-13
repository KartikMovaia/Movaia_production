// backend/src/routes/video.routes.ts

import { Router } from 'express';
import {
  getUploadUrl,
  confirmUpload,
  getUserAnalyses,
  deleteAnalysis,
} from '../controllers/video.controller';
import { authenticate, canUploadVideo } from '../../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get presigned URL for upload (coaches and individuals only)
router.post('/upload-url', canUploadVideo, getUploadUrl);

// Confirm upload completion
router.post('/confirm-upload', canUploadVideo, confirmUpload);

// Get user's analyses
router.get('/analyses', getUserAnalyses);

// Delete analysis
router.delete('/analysis/:analysisId', deleteAnalysis);

export default router;