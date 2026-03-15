import { prisma } from '../../lib/prisma';
import type { PaymentMethod } from '@prisma/client';

export interface CreatePaymentInput {
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethod;
}

function generateReceiptNo() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCPT-${Date.now()}-${rand}`;
}

function buildOrderBy(sortBy?: string, order?: string): Record<string, 'asc' | 'desc'> | { invoice: { invoiceNo: 'asc' | 'desc' } } {
  const allowedFields = [
    'receiptNo',
    'paymentDate',
    'amount',
    'method',
    'createdAt',
    'invoiceNo',
  ];

  const key = allowedFields.includes(sortBy || '') ? sortBy : 'createdAt';
  const direction: 'asc' | 'desc' = order === 'asc' ? 'asc' : 'desc';

  if (key === 'invoiceNo') {
    return { invoice: { invoiceNo: direction } };
  }
  return { [key as string]: direction };
}

export const paymentRepository = {
  findAll: async (
    page: number,
    pageSize: number,
    search?: string,
    sortBy?: string,
    order?: string
  ) => {
    const skip = (page - 1) * pageSize;

    let where: any = {};

    if (search?.trim()) {
      const term = search.trim();
      where = {
        OR: [
          { receiptNo: { contains: term, mode: 'insensitive' } },
          { invoice: { invoiceNo: { contains: term, mode: 'insensitive' } } },
          { invoice: { customerName: { contains: term, mode: 'insensitive' } } },
        ],
      };
    }

    const orderBy = buildOrderBy(sortBy, order);

    const items = await prisma.payment.findMany({
      where,
      orderBy,
      include: { invoice: true },
      skip,
      take: pageSize,
    });

    const total = await prisma.payment.count({ where });

    return { items, total, page, pageSize };
  },

  findById: async (id: string) => {
    return prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    });
  },

  createAndApplyToInvoice: async (data: CreatePaymentInput) => {
    const receiptNo = generateReceiptNo();
    const amount = Number(data.amount) || 0;

    const payment = await prisma.payment.create({
      data: {
        receiptNo,
        paymentDate: data.paymentDate,
        amount,
        method: data.method,
        invoiceId: data.invoiceId,
      },
    });

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: { increment: amount },
        balance: { decrement: amount },
      },
    });

    return { payment, invoice: await prisma.invoice.findUnique({ where: { id: data.invoiceId } }) };
  },

  updateAndReapplyToInvoice: async (
    id: string,
    data: {
      paymentDate?: Date;
      amount?: number;
      method?: PaymentMethod;
    }
  ) => {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('Payment not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }

    const oldAmount = Number(existing.amount);
    const newAmount = typeof data.amount === 'number' ? data.amount : oldAmount;
    const diff = newAmount - oldAmount;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        paymentDate: data.paymentDate ?? existing.paymentDate,
        amount: newAmount,
        method: data.method ?? existing.method,
      },
    });

    await prisma.invoice.update({
      where: { id: existing.invoiceId },
      data: {
        paidAmount: { increment: diff },
        balance: { decrement: diff },
      },
    });

    return { payment, invoice: await prisma.invoice.findUnique({ where: { id: existing.invoiceId } }) };
  },

  delete: async (id: string) => {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      const err = new Error('Payment not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }

    const amount = Number(payment.amount);

    await prisma.payment.delete({ where: { id } });

    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: { decrement: amount },
        balance: { increment: amount },
      },
    });

    return payment;
  },
};
