import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AccountType } from '@prisma/client';
import { verifyToken, TokenPayload } from '../../modules/auth/utils/auth.utils';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      currentUser?: any;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if session exists and is valid
    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session || session.expiresAt < new Date()) {
        res.status(401).json({ error: 'Session expired' });
        return;
      }
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        createdByCoachId: true,
        isUpgraded: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Attach user to request
    req.user = decoded;
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has specific account types
 */
export const requireAccountType = (...accountTypes: AccountType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!accountTypes.includes(req.currentUser.accountType)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: accountTypes,
        current: req.currentUser.accountType 
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user can upload videos
 */
export const canUploadVideo = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const allowedTypes: AccountType[] = [
    AccountType.INDIVIDUAL,
    AccountType.COACH,
    AccountType.ADMIN,
  ];

  if (!allowedTypes.includes(req.currentUser.accountType)) {
    res.status(403).json({ 
      error: 'Your account type does not allow video uploads. Please upgrade to an Individual plan.',
      accountType: req.currentUser.accountType 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user can manage athletes
 */
export const canManageAthletes = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const allowedTypes: AccountType[] = [AccountType.COACH, AccountType.ADMIN];

  if (!allowedTypes.includes(req.currentUser.accountType)) {
    res.status(403).json({ 
      error: 'Only coaches can manage athletes',
      accountType: req.currentUser.accountType 
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user owns the resource or is admin
 */
export const ownsResourceOrAdmin = (resourceUserIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const resourceUserId = req.params[resourceUserIdParam];
    
    // Admins can access everything
    if (req.currentUser.accountType === AccountType.ADMIN) {
      next();
      return;
    }

    // Check if user owns the resource
    if (req.currentUser.id !== resourceUserId) {
      // Check if it's a coach accessing their athlete's data
      if (req.currentUser.accountType === AccountType.COACH) {
        const athlete = await prisma.user.findFirst({
          where: {
            id: resourceUserId,
            createdByCoachId: req.currentUser.id,
          },
        });

        if (athlete) {
          next();
          return;
        }
      }

      res.status(403).json({ error: 'You do not have permission to access this resource' });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token, just doesn't set user
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = decoded;
      req.currentUser = user;
    }
  } catch (error) {
    // Silent fail - optional auth
    console.log('Optional auth failed:', error);
  }
  
  next();
};