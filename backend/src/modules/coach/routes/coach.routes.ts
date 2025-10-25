// backend/src/modules/coach/routes/coach.routes.ts

import { Router } from 'express';
import {
  getAthletes,
  getAthlete,
  createAthlete,
  updateAthlete,
  resetAthletePassword,
  removeAthlete,
  getAthleteAnalyses,
  getAllAthletesAnalyses,
  inviteAthlete,
  getCoachStats,
} from '../controllers/coach.controller';
import { authenticate, canManageAthletes } from '../../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication and coach account type
router.use(authenticate);
router.use(canManageAthletes);

// Athlete management routes
router.get('/athletes', getAthletes);
router.get('/athletes/:athleteId', getAthlete);
router.post('/athletes', createAthlete);
router.put('/athletes/:athleteId', updateAthlete);
router.post('/athletes/:athleteId/reset-password', resetAthletePassword);
router.delete('/athletes/:athleteId', removeAthlete);

// Athlete analyses routes
router.get('/athletes/:athleteId/analyses', getAthleteAnalyses);
router.get('/analyses', getAllAthletesAnalyses);

// Invite athlete
router.post('/invite-athlete', inviteAthlete);

// Coach statistics
router.get('/stats', getCoachStats);

export default router;