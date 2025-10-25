// backend/src/modules/coach/controllers/coach.controller.ts

import { Request, Response } from 'express';
import { coachService } from '../services/coach.service';

/**
 * Get all athletes managed by the coach
 */
export const getAthletes = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const athletes = await coachService.getAthletes(coachId);

    res.json({ athletes });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ error: 'Failed to get athletes' });
  }
};

/**
 * Get a specific athlete by ID
 */
export const getAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const athlete = await coachService.getAthlete(coachId, athleteId);

    res.json({ athlete });
  } catch (error: any) {
    console.error('Get athlete error:', error);
    
    if (error.message === 'Athlete not found or not managed by you') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get athlete' });
    }
  }
};

/**
 * Create a new athlete (coach-created account)
 */
export const createAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const athleteData = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate required fields
    if (!athleteData.email || !athleteData.firstName || !athleteData.lastName) {
      res.status(400).json({ error: 'Email, first name, and last name are required' });
      return;
    }

    const result = await coachService.createAthlete(coachId, athleteData);

    res.status(201).json({
      message: 'Athlete created successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Create athlete error:', error);
    
    if (error.message === 'User with this email already exists') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create athlete' });
    }
  }
};

/**
 * Update athlete profile
 */
export const updateAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;
    const updateData = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const updatedAthlete = await coachService.updateAthlete(coachId, athleteId, updateData);

    res.json({
      message: 'Athlete updated successfully',
      athlete: updatedAthlete,
    });
  } catch (error: any) {
    console.error('Update athlete error:', error);
    
    if (error.message.includes('not managed by you') || error.message.includes('upgraded athlete')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update athlete' });
    }
  }
};

/**
 * Reset athlete password
 */
export const resetAthletePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const tempPassword = await coachService.resetAthletePassword(coachId, athleteId);

    res.json({
      message: 'Password reset successfully',
      tempPassword,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    
    if (error.message === 'Athlete not found or not managed by you') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
};

/**
 * Remove/Disconnect athlete
 */
export const removeAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await coachService.removeAthlete(coachId, athleteId);

    res.json({ message: 'Athlete removed successfully' });
  } catch (error: any) {
    console.error('Remove athlete error:', error);
    
    if (error.message === 'Athlete not found or not managed by you') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to remove athlete' });
    }
  }
};

/**
 * Get analyses for a specific athlete
 */
export const getAthleteAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await coachService.getAthleteAnalyses(
      coachId,
      athleteId,
      Number(page),
      Number(limit)
    );

    res.json(result);
  } catch (error: any) {
    console.error('Get athlete analyses error:', error);
    
    if (error.message === 'Athlete not found or not managed by you') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get athlete analyses' });
    }
  }
};

/**
 * Get all analyses for all athletes (coach dashboard)
 */
export const getAllAthletesAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const filters: any = {};
    if (athleteId) filters.athleteId = athleteId as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await coachService.getAllAthletesAnalyses(
      coachId,
      filters,
      Number(page),
      Number(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get all athletes analyses error:', error);
    res.status(500).json({ error: 'Failed to get analyses' });
  }
};

/**
 * Invite existing Movaia user as athlete
 */
export const inviteAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;
    const { athleteEmail } = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!athleteEmail) {
      res.status(400).json({ error: 'Athlete email is required' });
      return;
    }

    const result = await coachService.inviteAthlete(coachId, athleteEmail);

    res.json(result);
  } catch (error: any) {
    console.error('Invite athlete error:', error);
    
    if (error.message.includes('not found') || error.message.includes('already connected')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to invite athlete' });
    }
  }
};

/**
 * Get coach statistics
 */
export const getCoachStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = req.currentUser?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stats = await coachService.getCoachStats(coachId);

    res.json({ stats });
  } catch (error) {
    console.error('Get coach stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};