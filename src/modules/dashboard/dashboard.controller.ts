import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { getDashboardStats } from './dashboard.service';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getDashboardStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};
