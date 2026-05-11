import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { getStats } from './dashboard.controller';

const router = Router();

router.use(authenticate);
router.get('/', getStats);

export default router;
