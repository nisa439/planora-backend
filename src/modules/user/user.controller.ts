import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { changePassword, getProfile, searchUsers, updateProfile } from './user.service';

export const profile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch {
    res.status(404).json({ success: false, message: 'User not found' });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    res.status(400).json({ success: false, message });
  }
};

export const password = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'currentPassword and newPassword required' });
    return;
  }
  try {
    await changePassword(req.user!.userId, { currentPassword, newPassword });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to change password';
    res.status(400).json({ success: false, message });
  }
};

export const search = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, projectId } = req.query;
  if (!q || String(q).trim().length < 2) {
    res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    return;
  }
  try {
    const users = await searchUsers(String(q), projectId ? Number(projectId) : undefined);
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};
