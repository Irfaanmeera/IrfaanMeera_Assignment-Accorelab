import { Prisma } from '@prisma/client';
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

const SORT_KEYS = ['receiptNo', 'paymentDate', 'amount', 'method', 'createdAt', 'invoiceNo'] as const;
type SortKey = (typeof SORT_KEYS)[number];

function buildOrderBy(sortBy: string, order?: string): Prisma.PaymentOrderByWithRelationInput {
  const dir: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
  if (sortBy === 'invoiceNo') return { invoice: { invoiceNo: dir } };
  const key = SORT_KEYS.includes(sortBy as SortKey) ? sortBy : 'createdAt';
  return { [key]: dir };
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
    const where = search?.trim()
      ? {
          OR: [
            { receiptNo: { contains: search.trim(), mode: 'insensitive' as const } },
            { invoice: { invoiceNo: { contains: search.trim(), mode: 'insensitive' as const } } },
            { invoice: { customerName: { contains: search.trim(), mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const orderBy = buildOrderBy(sortBy || 'createdAt', order || 'desc');

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        orderBy,
        include: { invoice: true },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

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

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          receiptNo,
          paymentDate: data.paymentDate,
          amount,
          method: data.method,
          invoiceId: data.invoiceId,
        },
      });

      const invoice = await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: { increment: amount },
          balance: { decrement: amount },
        },
      });

      return { payment, invoice };
    });
  },

  updateAndReapplyToInvoice: async (
    id: string,
    data: {
      paymentDate?: Date;
      amount?: number;
      method?: PaymentMethod;
    }
  ) => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { id } });
      if (!existing) {
        const err = new Error('Payment not found') as Error & { statusCode?: number };
        err.statusCode = 404;
        throw err;
      }

      const oldAmount = Number(existing.amount);
      const newAmount = typeof data.amount === 'number' ? data.amount : oldAmount;
      const diff = newAmount - oldAmount;

      const payment = await tx.payment.update({
        where: { id },
        data: {
          paymentDate: data.paymentDate ?? existing.paymentDate,
          amount: newAmount,
          method: data.method ?? existing.method,
        },
      });

      const invoice = await tx.invoice.update({
        where: { id: existing.invoiceId },
        data: {
          paidAmount: { increment: diff },
          balance: { decrement: diff },
        },
      });

      return { payment, invoice };
    });
  },

  delete: async (id: string) => {
    return prisma.payment.delete({ where: { id } });
  },
};
