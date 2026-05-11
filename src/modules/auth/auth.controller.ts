import { Request, Response } from 'express';
import { validateLogin, validateRegister } from './auth.validation';
import { loginUser, refreshTokens, registerUser } from './auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  const error = validateRegister(req.body);
  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  try {
    const result = await registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ success: false, message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const error = validateLogin(req.body);
  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  try {
    const result = await loginUser(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ success: false, message });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token required' });
    return;
  }

  try {
    const result = await refreshTokens(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};
