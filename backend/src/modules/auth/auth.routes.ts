import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/login', asyncHandler(authController.login));
router.get('/profile', authenticate, asyncHandler(authController.getProfile));

export const authRoutes = router;
