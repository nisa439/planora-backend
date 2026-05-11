import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { getStatusesByProject } from './task-status.service';

export const getStatuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statuses = await getStatusesByProject(Number(req.params.projectId), req.user!.userId);
    res.json({ success: true, data: statuses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch statuses';
    res.status(404).json({ success: false, message });
  }
};
