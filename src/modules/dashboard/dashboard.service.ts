import prisma from '../../shared/config/prisma';

export const getDashboardStats = async (userId: number) => {
  const [totalProjects, myTasks, recentTasks, projectStats] = await Promise.all([
    prisma.project.count({
      where: { members: { some: { userId } } },
    }),

    prisma.task.groupBy({
      by: ['statusId'],
      where: { assigneeId: userId },
      _count: { id: true },
    }),

    prisma.task.findMany({
      where: { project: { members: { some: { userId } } } },
      select: {
        id: true,
        title: true,
        priority: true,
        type: true,
        createdAt: true,
        status: { select: { name: true } },
        project: { select: { id: true, projectName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    prisma.project.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true,
        projectName: true,
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: { select: { name: true } } },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const statusMap = await prisma.taskStatus.findMany({
    where: { project: { members: { some: { userId } } } },
    select: { id: true, name: true },
  });

  const statusNameById = Object.fromEntries(statusMap.map((s) => [s.id, s.name]));

  const tasksByStatus = myTasks.map((g) => ({
    status: statusNameById[g.statusId] || 'Unknown',
    count: g._count.id,
  }));

  const openTasks = myTasks
    .filter((g) => statusNameById[g.statusId] !== 'Done')
    .reduce((sum, g) => sum + g._count.id, 0);

  const doneTasks = myTasks
    .filter((g) => statusNameById[g.statusId] === 'Done')
    .reduce((sum, g) => sum + g._count.id, 0);

  const projects = projectStats.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status.name === 'Done').length;
    return {
      id: p.id,
      projectName: p.projectName,
      totalTasks: total,
      doneTasks: done,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    totalProjects,
    openTasks,
    doneTasks,
    tasksByStatus,
    recentTasks,
    projects,
  };
};
