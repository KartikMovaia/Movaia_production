// backend/src/modules/user/routes/user.routes.ts

import { Router } from 'express';
import multer from 'multer';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteProfileImage,
  getCurrentSubscription,
  getAvailablePlans,
  getBillingHistory,
  getPaymentMethods,
  getSessions,
  revokeSession,
  exportUserData,
  deleteAccount,
  cancelSubscription
} from '../controllers/user.controller';
import { 
  upgradeSubscription,
  downgradeSubscription,
  reactivateSubscription,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  downloadInvoice
} from '../controllers/billing.controller';
import { authenticate } from '../../../shared/middleware/auth.middleware';

const router = Router();

// Configure multer for profile image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/profile/image', upload.single('profileImage'), uploadProfileImage);
router.delete('/profile/image', deleteProfileImage);

// Subscription routes
router.get('/subscription', getCurrentSubscription);
router.post('/subscription/upgrade', upgradeSubscription);
router.post('/subscription/downgrade', downgradeSubscription);
router.post('/subscription/cancel', cancelSubscription);
router.post('/subscription/reactivate', reactivateSubscription);

// Billing routes
router.get('/billing/history', getBillingHistory);
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:paymentMethodId', deletePaymentMethod);
router.put('/payment-methods/:paymentMethodId/default', setDefaultPaymentMethod);
router.get('/invoices/:paymentId', downloadInvoice);

// Security routes (without 2FA)
router.get('/security/sessions', getSessions);
router.delete('/security/sessions/:sessionId', revokeSession);

// Account management routes
router.get('/export-data', exportUserData);
router.delete('/account', deleteAccount);

// Public routes (no auth required)
const publicRouter = Router();
publicRouter.get('/subscriptions/plans', getAvailablePlans);

export { router as userRoutes, publicRouter as publicUserRoutes };