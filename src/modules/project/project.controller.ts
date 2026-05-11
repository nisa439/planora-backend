import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import {
  addMember,
  createProject,
  deleteProject,
  getProjectById,
  getUserProjects,
  removeMember,
  updateProject,
} from './project.service';

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectName, description } = req.body;

  if (!projectName || projectName.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Project name must be at least 2 characters' });
    return;
  }

  try {
    const project = await createProject({
      projectName,
      description,
      createdById: req.user!.userId,
    });
    res.status(201).json({ success: true, data: project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    res.status(400).json({ success: false, message });
  }
};

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await getUserProjects(req.user!.userId);
    res.json({ success: true, data: projects });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await getProjectById(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch project';
    res.status(404).json({ success: false, message });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await updateProject(Number(req.params.id), req.user!.userId, req.body);
    res.json({ success: true, data: project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project';
    res.status(400).json({ success: false, message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteProject(Number(req.params.id), req.user!.userId);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete project';
    res.status(400).json({ success: false, message });
  }
};

export const add = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required' });
    return;
  }

  try {
    const member = await addMember(Number(req.params.id), req.user!.userId, Number(userId));
    res.status(201).json({ success: true, data: member });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add member';
    res.status(400).json({ success: false, message });
  }
};

export const kick = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await removeMember(Number(req.params.id), req.user!.userId, Number(req.params.userId));
    res.json({ success: true, message: 'Member removed' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove member';
    res.status(400).json({ success: false, message });
  }
};
