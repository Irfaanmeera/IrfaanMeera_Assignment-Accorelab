import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { paymentService } from './payment.service';

export const paymentController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
    const order = typeof req.query.order === 'string' ? req.query.order : undefined;

    const payments = await paymentService.getAll(page, pageSize, search, sortBy, order);
    sendSuccess(res, payments);
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const payment = await paymentService.getById(id);
    sendSuccess(res, payment);
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.create(req.body);
    sendSuccess(res, result, 'Payment created', 201);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await paymentService.update(id, req.body);
    sendSuccess(res, result);
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await paymentService.delete(id);
    sendSuccess(res, null, 'Payment deleted', 204);
  },
};
