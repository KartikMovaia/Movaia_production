import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../../../shared/middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;