import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, authorize } from '../../middleware/authenticate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(paymentController.getAll));
router.get('/:id', asyncHandler(paymentController.getById));
router.post('/', authorize('admin', 'accounts'), asyncHandler(paymentController.create));
router.patch('/:id', authorize('admin', 'accounts'), asyncHandler(paymentController.update));
router.delete('/:id', authorize('admin', 'accounts'), asyncHandler(paymentController.delete));

export const paymentRoutes = router;
