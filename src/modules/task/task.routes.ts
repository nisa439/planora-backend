import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { create, getByProject, getOne, move, myTasks, remove, update } from './task.controller';

const router = Router();

router.use(authenticate);

router.get('/my', myTasks);
router.get('/project/:projectId', getByProject);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.patch('/:id/move', move);
router.delete('/:id', remove);

export default router;
