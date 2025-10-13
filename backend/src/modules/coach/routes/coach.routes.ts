import { Router } from 'express';
import {
  createAthlete,
  getAthletes,
  getAthleteById,
  updateAthlete,
  resetAthletePassword,
  removeAthlete,
} from '../controllers/coach.controller';
import { authenticate, canManageAthletes } from '../../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication and coach permissions
router.use(authenticate);
router.use(canManageAthletes);

// Athlete management routes
router.post('/athletes', createAthlete);
router.get('/athletes', getAthletes);
router.get('/athletes/:athleteId', getAthleteById);
router.put('/athletes/:athleteId', updateAthlete);
router.post('/athletes/:athleteId/reset-password', resetAthletePassword);
router.delete('/athletes/:athleteId', removeAthlete);

export default router;