import bcrypt from 'bcryptjs';
import prisma from '../../shared/config/prisma';

export const getProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      role: { select: { name: true } },
    },
  });
  if (!user) throw new Error('User not found');
  return user;
};

export const updateProfile = async (
  userId: number,
  data: { firstName?: string; lastName?: string }
) => {
  if (data.firstName && data.firstName.trim().length < 2)
    throw new Error('First name must be at least 2 characters');
  if (data.lastName && data.lastName.trim().length < 2)
    throw new Error('Last name must be at least 2 characters');

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName && { firstName: data.firstName.trim() }),
      ...(data.lastName && { lastName: data.lastName.trim() }),
    },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
};

export const changePassword = async (
  userId: number,
  data: { currentPassword: string; newPassword: string }
) => {
  if (!data.newPassword || data.newPassword.length < 6)
    throw new Error('New password must be at least 6 characters');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(data.currentPassword, user.password);
  if (!isMatch) throw new Error('Current password is incorrect');

  const hashed = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

export const searchUsers = async (query: string, projectId?: number) => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query.toLowerCase() } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 10,
  });

  if (!projectId) return users;

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));

  return users.filter((u) => !memberIds.has(u.id));
};
