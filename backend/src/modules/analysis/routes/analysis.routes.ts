// backend/src/modules/analysis/routes/analysis.routes.ts
import { Router } from 'express';
import {
  triggerAnalysis,
  handleWebhook,
  getAnalysis,
  getAnalysisFiles,
  getUserAnalyses,
} from '../controllers/analysis.controller';
import { authenticate } from '../../../shared/middleware/auth.middleware';
import { generateAnalysisPDF } from '../controllers/pdf.controller';

const router = Router();

// Webhook endpoint (no auth required - but you should add signature verification)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(authenticate);

router.post('/trigger', triggerAnalysis);
router.get('/list', getUserAnalyses);
router.get('/:analysisId', getAnalysis);
router.get('/:analysisId/files', getAnalysisFiles);  // New endpoint
router.get('/:analysisId/pdf', generateAnalysisPDF);
// router.delete('/:analysisId', deleteAnalysis);      // Optional: for cleanup

export default router;