import bcrypt from 'bcryptjs';
import prisma from '../../shared/config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';

export const registerUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already in use');

  let memberRole = await prisma.role.findUnique({ where: { name: 'Member' } });
  if (!memberRole) {
    await prisma.role.createMany({
      data: [
        { name: 'System Admin' },
        { name: 'Project Admin' },
        { name: 'Member' },
      ],
      skipDuplicates: true,
    });
    memberRole = await prisma.role.findUnique({ where: { name: 'Member' } });
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      password: hashedPassword,
      roleId: memberRole!.id,
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } },
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  return { user, accessToken, refreshToken };
};

export const loginUser = async (data: { email: string; password: string }) => {
  const email = data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { select: { name: true } } },
  });

  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  const { password: _, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
};

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true },
  });

  if (!user) throw new Error('User not found');

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  return { accessToken, refreshToken };
};
