import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import {
  createTask,
  deleteTask,
  getMyTasks,
  getTaskById,
  getTasksByProject,
  moveTask,
  updateTask,
} from './task.service';

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, statusId, projectId } = req.body;

  if (!title || title.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Title must be at least 2 characters' });
    return;
  }
  if (!statusId || !projectId) {
    res.status(400).json({ success: false, message: 'statusId and projectId are required' });
    return;
  }

  try {
    const task = await createTask({ ...req.body, reporterId: req.user!.userId });
    res.status(201).json({ success: true, data: task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create task';
    res.status(400).json({ success: false, message });
  }
};

export const getByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await getTasksByProject(
      Number(req.params.projectId),
      req.user!.userId,
      req.query as { priority?: string; assigneeId?: string; statusId?: string }
    );
    res.json({ success: true, data: tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
    res.status(404).json({ success: false, message });
  }
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await getTaskById(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Task not found';
    res.status(404).json({ success: false, message });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await updateTask(Number(req.params.id), req.user!.userId, req.body);
    res.json({ success: true, data: task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update task';
    res.status(400).json({ success: false, message });
  }
};

export const move = async (req: AuthRequest, res: Response): Promise<void> => {
  const { statusId, order } = req.body;

  if (statusId === undefined || order === undefined) {
    res.status(400).json({ success: false, message: 'statusId and order are required' });
    return;
  }

  try {
    const task = await moveTask(Number(req.params.id), req.user!.userId, { statusId, order });
    res.json({ success: true, data: task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to move task';
    res.status(400).json({ success: false, message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteTask(Number(req.params.id), req.user!.userId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete task';
    res.status(400).json({ success: false, message });
  }
};

export const myTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await getMyTasks(
      req.user!.userId,
      req.query as { priority?: string; statusId?: string }
    );
    res.json({ success: true, data: tasks });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};
