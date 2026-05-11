import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { password, profile, search, update } from './user.controller';

const router = Router();

router.use(authenticate);

router.get('/profile', profile);
router.put('/profile', update);
router.put('/password', password);
router.get('/search', search);

export default router;
