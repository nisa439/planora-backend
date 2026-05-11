import prisma from '../../shared/config/prisma';

const DEFAULT_STATUSES = [
  { name: 'To Do', position: 1, isDefault: true },
  { name: 'In Progress', position: 2, isDefault: false },
  { name: 'Done', position: 3, isDefault: false },
];

export const createProject = async (data: {
  projectName: string;
  description?: string;
  createdById: number;
}) => {
  const project = await prisma.project.create({
    data: {
      projectName: data.projectName.trim(),
      description: data.description?.trim(),
      createdById: data.createdById,
      taskStatuses: {
        create: DEFAULT_STATUSES,
      },
    },
    include: { taskStatuses: true },
  });

  let adminRole = await prisma.role.findUnique({ where: { name: 'Project Admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'Project Admin' } });
  }

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: data.createdById,
      roleId: adminRole.id,
    },
  });

  return project;
};

export const getUserProjects = async (userId: number) => {
  return prisma.project.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          role: { select: { name: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjectById = async (projectId: number, userId: number) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      members: { some: { userId } },
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          role: { select: { name: true } },
        },
      },
      taskStatuses: { orderBy: { position: 'asc' } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) throw new Error('Project not found');
  return project;
};

export const updateProject = async (
  projectId: number,
  userId: number,
  data: { projectName?: string; description?: string }
) => {
  await requireProjectAdmin(projectId, userId);

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.projectName && { projectName: data.projectName.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
    },
  });
};

export const deleteProject = async (projectId: number, userId: number) => {
  await requireProjectAdmin(projectId, userId);
  await prisma.project.delete({ where: { id: projectId } });
};

export const addMember = async (projectId: number, requesterId: number, newUserId: number) => {
  await requireProjectAdmin(projectId, requesterId);

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: newUserId } },
  });
  if (existing) throw new Error('User is already a member');

  const memberRole = await prisma.role.findUnique({ where: { name: 'Member' } });
  if (!memberRole) throw new Error('Member role not found');

  return prisma.projectMember.create({
    data: { projectId, userId: newUserId, roleId: memberRole.id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      role: { select: { name: true } },
    },
  });
};

export const removeMember = async (projectId: number, requesterId: number, targetUserId: number) => {
  await requireProjectAdmin(projectId, requesterId);

  if (requesterId === targetUserId) throw new Error('Cannot remove yourself as admin');

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
  if (!member) throw new Error('User is not a member of this project');

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
};

const requireProjectAdmin = async (projectId: number, userId: number) => {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { role: true },
  });

  if (!membership) throw new Error('Project not found');
  if (membership.role.name !== 'Project Admin') throw new Error('Insufficient permissions');
};
