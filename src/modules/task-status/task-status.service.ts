import prisma from '../../shared/config/prisma';

export const getStatusesByProject = async (projectId: number, userId: number) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new Error('Project not found');

  return prisma.taskStatus.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
  });
};
