import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { add, create, getAll, getOne, kick, remove, update } from './project.controller';

const router = Router();

router.use(authenticate);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/members', add);
router.delete('/:id/members/:userId', kick);

export default router;
