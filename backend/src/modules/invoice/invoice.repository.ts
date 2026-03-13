import { prisma } from '../../lib/prisma';

export interface CreateInvoiceInput {
  customerName: string;
  invoiceDate: Date;
  amount: number;
}

function generateInvoiceNo() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${Date.now()}-${rand}`;
}

const SORT_KEYS = ['invoiceNo', 'customerName', 'invoiceDate', 'amount', 'paidAmount', 'balance', 'createdAt'] as const;
type SortKey = (typeof SORT_KEYS)[number];

function buildOrderBy(sortBy: string, order: string) {
  const key = SORT_KEYS.includes(sortBy as SortKey) ? sortBy : 'createdAt';
  const dir = order === 'asc' ? 'asc' : 'desc';
  return { [key]: dir };
}

export const invoiceRepository = {
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
            { customerName: { contains: search.trim(), mode: 'insensitive' as const } },
            { invoiceNo: { contains: search.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {};

    const orderBy = buildOrderBy(sortBy || 'createdAt', order || 'desc');

    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  findById: async (id: string) => {
    return prisma.invoice.findUnique({
      where: { id },
    });
  },

  update: async (
    id: string,
    data: {
      customerName?: string;
      invoiceDate?: Date;
      amount?: number;
    }
  ) => {
    return prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUnique({ where: { id } });
      if (!current) {
        const err = new Error('Invoice not found') as Error & { statusCode?: number };
        err.statusCode = 404;
        throw err;
      }

      const amount = typeof data.amount === 'number' ? data.amount : Number(current.amount);
      const paid = Number(current.paidAmount);
      const balance = amount - paid;

      return tx.invoice.update({
        where: { id },
        data: {
          customerName: data.customerName ?? current.customerName,
          invoiceDate: data.invoiceDate ?? current.invoiceDate,
          amount,
          balance,
        },
      });
    });
  },

  create: async (data: CreateInvoiceInput) => {
    const invoiceNo = generateInvoiceNo();
    const amount = Number(data.amount) || 0;
    return prisma.invoice.create({
      data: {
        invoiceNo,
        customerName: data.customerName,
        invoiceDate: data.invoiceDate,
        amount,
        paidAmount: 0,
        balance: amount,
      },
    });
  },

  delete: async (id: string) => {
    return prisma.invoice.delete({ where: { id } });
  },

  findDistinctCustomerNames: async (search?: string, limit = 20) => {
    const where = search?.trim()
      ? { customerName: { contains: search.trim(), mode: 'insensitive' as const } }
      : {};
    const invoices = await prisma.invoice.findMany({
      where,
      select: { customerName: true },
      distinct: ['customerName'],
      orderBy: { customerName: 'asc' },
      take: limit,
    });
    return invoices.map((i) => i.customerName);
  },
};
