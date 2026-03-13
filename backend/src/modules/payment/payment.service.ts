import { paymentRepository } from './payment.repository';
import type { PaymentMethod } from '@prisma/client';

export const paymentService = {
  getAll: async (
    page: number,
    pageSize: number,
    search?: string,
    sortBy?: string,
    order?: string
  ) => {
    return paymentRepository.findAll(page, pageSize, search, sortBy, order);
  },

  getById: async (id: string) => {
    return paymentRepository.findById(id);
  },

  create: async (data: { invoiceId?: string; paymentDate?: string; amount?: number; method?: PaymentMethod }) => {
    if (!data.invoiceId) {
      const err = new Error('invoiceId is required') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    if (!data.paymentDate) {
      const err = new Error('paymentDate is required') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    if (!data.method) {
      const err = new Error('method is required') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const date = new Date(data.paymentDate);
    if (Number.isNaN(date.getTime())) {
      const err = new Error('paymentDate must be a valid date') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    return paymentRepository.createAndApplyToInvoice({
      invoiceId: data.invoiceId,
      paymentDate: date,
      amount: Number(data.amount) || 0,
      method: data.method,
    });
  },

  update: async (id: string, data: { paymentDate?: string; amount?: number; method?: PaymentMethod }) => {
    if (!data.paymentDate && typeof data.amount === 'undefined' && !data.method) {
      const err = new Error('Nothing to update') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const patch: { paymentDate?: Date; amount?: number; method?: PaymentMethod } = {};

    if (typeof data.amount !== 'undefined') {
      patch.amount = Number(data.amount) || 0;
    }

    if (data.paymentDate) {
      const date = new Date(data.paymentDate);
      if (Number.isNaN(date.getTime())) {
        const err = new Error('paymentDate must be a valid date') as Error & { statusCode?: number };
        err.statusCode = 400;
        throw err;
      }
      patch.paymentDate = date;
    }

    if (data.method) {
      patch.method = data.method;
    }

    return paymentRepository.updateAndReapplyToInvoice(id, patch);
  },

  delete: async (_id: string) => {
    return paymentRepository.delete(_id);
  },
};
