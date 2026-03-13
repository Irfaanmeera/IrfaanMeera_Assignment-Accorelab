import { invoiceRepository } from './invoice.repository';

export const invoiceService = {
  getAll: async (
    page: number,
    pageSize: number,
    search?: string,
    sortBy?: string,
    order?: string
  ) => {
    return invoiceRepository.findAll(page, pageSize, search, sortBy, order);
  },

  getById: async (id: string) => {
    return invoiceRepository.findById(id);
  },

  create: async (data: { customerName?: string; invoiceDate?: string; amount?: number }) => {
    if (!data.customerName?.trim()) {
      const err = new Error('customerName is required') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    if (!data.invoiceDate) {
      const err = new Error('invoiceDate is required') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const date = new Date(data.invoiceDate);
    if (Number.isNaN(date.getTime())) {
      const err = new Error('invoiceDate must be a valid date') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    return invoiceRepository.create({
      customerName: data.customerName.trim(),
      invoiceDate: date,
      amount: Number(data.amount) || 0,
    });
  },

  update: async (id: string, data: { customerName?: string; invoiceDate?: string; amount?: number }) => {
    if (!data.customerName && !data.invoiceDate && typeof data.amount === 'undefined') {
      const err = new Error('Nothing to update') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const patch: { customerName?: string; invoiceDate?: Date; amount?: number } = {};
    if (data.customerName) patch.customerName = data.customerName.trim();

    if (typeof data.amount !== 'undefined') {
      patch.amount = Number(data.amount) || 0;
    }

    if (data.invoiceDate) {
      const date = new Date(data.invoiceDate);
      if (Number.isNaN(date.getTime())) {
        const err = new Error('invoiceDate must be a valid date') as Error & { statusCode?: number };
        err.statusCode = 400;
        throw err;
      }
      patch.invoiceDate = date;
    }

    return invoiceRepository.update(id, patch);
  },

  delete: async (id: string) => {
    return invoiceRepository.delete(id);
  },

  getCustomerNames: async (search?: string, limit?: number) => {
    return invoiceRepository.findDistinctCustomerNames(search, limit);
  },
};
