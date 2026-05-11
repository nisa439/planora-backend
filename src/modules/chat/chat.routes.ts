import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { chat } from './chat.controller';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many chat requests, slow down' },
});

router.use(authenticate);
router.post('/', chatLimiter, chat);

export default router;
