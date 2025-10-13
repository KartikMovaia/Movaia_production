// backend/src/modules/analysis/controllers/analysis.controller.ts
import { Request, Response } from 'express';
import { analysisService } from '../services/analysis.service';

export const triggerAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.body;

    if (!analysisId) {
      res.status(400).json({ error: 'Analysis ID is required' });
      return;
    }

    await analysisService.triggerAnalysis(analysisId);

    res.json({ 
      message: 'Analysis triggered successfully', 
      analysisId 
    });
  } catch (error) {
    console.error('Trigger analysis error:', error);
    res.status(500).json({ error: 'Failed to trigger analysis' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received webhook from EC2:', req.body);

    await analysisService.handleAnalysisComplete(req.body);

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

export const getAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const userId = req.currentUser?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const analysis = await analysisService.getAnalysis(analysisId, userId);

    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
};

export const getAnalysisFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const userId = req.currentUser?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await analysisService.getAnalysisFiles(analysisId, userId);

    res.json(result);
  } catch (error) {
    console.error('Get analysis files error:', error);
    
    // Proper TypeScript error handling
    if (error instanceof Error && error.message === 'Analysis not found') {
      res.status(404).json({ error: 'Analysis not found' });
    } else {
      res.status(500).json({ error: 'Failed to get analysis files' });
    }
  }
};

export const getUserAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await analysisService.getUserAnalyses(
      userId,
      Number(page),
      Number(limit),
      status as any
    );

    res.json(result);
  } catch (error) {
    console.error('Get user analyses error:', error);
    res.status(500).json({ error: 'Failed to get analyses' });
  }
};

// export const deleteAnalysis = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { analysisId } = req.params;
//     const userId = req.currentUser?.id;

//     if (!userId) {
//       res.status(401).json({ error: 'Unauthorized' });
//       return;
//     }

//     await analysisService.deleteAnalysis(analysisId, userId);

//     res.json({ message: 'Analysis deleted successfully' });
//   } catch (error) {
//     console.error('Delete analysis error:', error);
    
//     // Proper TypeScript error handling
//     if (error instanceof Error && error.message === 'Analysis not found') {
//       res.status(404).json({ error: 'Analysis not found' });
//     } else {
//       res.status(500).json({ error: 'Failed to delete analysis' });
//     }
//   }
// };