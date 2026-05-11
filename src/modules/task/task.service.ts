import { Priority, TaskType } from '@prisma/client';
import prisma from '../../shared/config/prisma';

const taskSelect = {
  id: true,
  title: true,
  description: true,
  priority: true,
  type: true,
  order: true,
  dueDate: true,
  createdAt: true,
  status: { select: { id: true, name: true, position: true } },
  project: { select: { id: true, projectName: true } },
  reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
};

const requireMember = async (projectId: number, userId: number) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new Error('Project not found');
  return member;
};

export const createTask = async (data: {
  title: string;
  description?: string;
  priority?: Priority;
  type?: TaskType;
  statusId: number;
  projectId: number;
  reporterId: number;
  assigneeId?: number;
  dueDate?: string;
}) => {
  await requireMember(data.projectId, data.reporterId);

  const status = await prisma.taskStatus.findFirst({
    where: { id: data.statusId, projectId: data.projectId },
  });
  if (!status) throw new Error('Invalid status for this project');

  const maxOrder = await prisma.task.aggregate({
    where: { statusId: data.statusId },
    _max: { order: true },
  });

  return prisma.task.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim(),
      priority: data.priority || Priority.MEDIUM,
      type: data.type || TaskType.TASK,
      order: (maxOrder._max.order ?? 0) + 1,
      statusId: data.statusId,
      projectId: data.projectId,
      reporterId: data.reporterId,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    select: taskSelect,
  });
};

export const getTasksByProject = async (
  projectId: number,
  userId: number,
  filters: { priority?: string; assigneeId?: string; statusId?: string }
) => {
  await requireMember(projectId, userId);

  return prisma.task.findMany({
    where: {
      projectId,
      ...(filters.priority && { priority: filters.priority as Priority }),
      ...(filters.assigneeId && { assigneeId: Number(filters.assigneeId) }),
      ...(filters.statusId && { statusId: Number(filters.statusId) }),
    },
    select: taskSelect,
    orderBy: [{ statusId: 'asc' }, { order: 'asc' }],
  });
};

export const getTaskById = async (taskId: number, userId: number) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { ...taskSelect, projectId: true },
  });
  if (!task) throw new Error('Task not found');

  await requireMember(task.projectId, userId);
  return task;
};

export const updateTask = async (
  taskId: number,
  userId: number,
  data: {
    title?: string;
    description?: string;
    priority?: Priority;
    type?: TaskType;
    assigneeId?: number | null;
    dueDate?: string | null;
  }
) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');
  await requireMember(task.projectId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() }),
      ...(data.priority && { priority: data.priority }),
      ...(data.type && { type: data.type }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
    },
    select: taskSelect,
  });
};

export const moveTask = async (
  taskId: number,
  userId: number,
  data: { statusId: number; order: number }
) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');
  await requireMember(task.projectId, userId);

  const status = await prisma.taskStatus.findFirst({
    where: { id: data.statusId, projectId: task.projectId },
  });
  if (!status) throw new Error('Invalid status');

  return prisma.task.update({
    where: { id: taskId },
    data: { statusId: data.statusId, order: data.order },
    select: taskSelect,
  });
};

export const deleteTask = async (taskId: number, userId: number) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');
  await requireMember(task.projectId, userId);
  await prisma.task.delete({ where: { id: taskId } });
};

export const getMyTasks = async (
  userId: number,
  filters: { priority?: string; statusId?: string }
) => {
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      project: { members: { some: { userId } } },
      ...(filters.priority && { priority: filters.priority as Priority }),
      ...(filters.statusId && { statusId: Number(filters.statusId) }),
    },
    select: taskSelect,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
};
