import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

const router = Router();

// GET /api/dashboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = req.query.user_id 
      ? parseInt(req.query.user_id as string, 10) 
      : (req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string, 10) : undefined);

    const metrics = await dashboardService.getDashboardMetrics(currentUserId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error loading dashboard metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
