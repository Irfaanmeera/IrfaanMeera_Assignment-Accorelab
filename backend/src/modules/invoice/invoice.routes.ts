import { Router } from 'express';
import { invoiceController } from './invoice.controller';
import { authenticate, authorize } from '../../middleware/authenticate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(invoiceController.getAll));
router.get('/customer-names', authorize('admin', 'sales'), asyncHandler(invoiceController.getCustomerNames));
router.get('/:id', asyncHandler(invoiceController.getById));
router.post('/', authorize('admin', 'sales'), asyncHandler(invoiceController.create));
router.patch('/:id', authorize('admin', 'sales'), asyncHandler(invoiceController.update));
router.delete('/:id', authorize('admin'), asyncHandler(invoiceController.delete));

export const invoiceRoutes = router;
