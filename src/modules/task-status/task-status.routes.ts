import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { getStatuses } from './task-status.controller';

const router = Router();

router.use(authenticate);
router.get('/projects/:projectId/statuses', getStatuses);

export default router;
