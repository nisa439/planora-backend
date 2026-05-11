import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, refresh, register } from './auth.controller';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, try again in 15 minutes' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many registrations, try again in 1 hour' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);

export default router;
