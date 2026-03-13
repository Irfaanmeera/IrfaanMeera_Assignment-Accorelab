import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { invoiceService } from './invoice.service';

export const invoiceController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
    const order = typeof req.query.order === 'string' ? req.query.order : undefined;

    const invoices = await invoiceService.getAll(page, pageSize, search, sortBy, order);
    sendSuccess(res, invoices);
  },

  getCustomerNames: async (req: Request, res: Response): Promise<void> => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = typeof req.query.limit === 'string' ? Math.min(100, parseInt(req.query.limit, 10) || 20) : 20;
    const names = await invoiceService.getCustomerNames(search, limit);
    sendSuccess(res, { names });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const invoice = await invoiceService.getById(id);
    sendSuccess(res, invoice);
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const result = await invoiceService.create(req.body);
    sendSuccess(res, result, 'Invoice created', 201);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await invoiceService.update(id, req.body);
    sendSuccess(res, result);
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await invoiceService.delete(id);
    sendSuccess(res, null, 'Invoice deleted', 204);
  },
};
