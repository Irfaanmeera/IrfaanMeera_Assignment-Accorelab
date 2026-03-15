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

function buildOrderBy(sortBy?: string, order?: string) {
  const allowedFields = [
    'invoiceNo',
    'customerName',
    'invoiceDate',
    'amount',
    'paidAmount',
    'balance',
    'createdAt',
  ];

  const key = allowedFields.includes(sortBy || '') ? sortBy : 'createdAt';
  const direction = order === 'asc' ? 'asc' : 'desc';

  return { [key as string]: direction };
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

    let where: any = {};

    if (search) {
      where = {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { invoiceNo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const orderBy = buildOrderBy(sortBy, order);

    const items = await prisma.invoice.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    });

    const total = await prisma.invoice.count({ where });

    return {
      items,
      total,
      page,
      pageSize,
    };
  },

  findById: async (id: string) => {
    return prisma.invoice.findUnique({
      where: { id },
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

  update: async (
    id: string,
    data: {
      customerName?: string;
      invoiceDate?: Date;
      amount?: number;
    }
  ) => {

    const current = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error('Invoice not found');
    }

    const amount = data.amount !== undefined ? data.amount : Number(current.amount);
    const paid = Number(current.paidAmount);
    const balance = amount - paid;

    return prisma.invoice.update({
      where: { id },
      data: {
        customerName: data.customerName || current.customerName,
        invoiceDate: data.invoiceDate || current.invoiceDate,
        amount,
        balance,
      },
    });

  },

  delete: async (id: string) => {
    return prisma.invoice.delete({
      where: { id },
    });
  },

  findDistinctCustomerNames: async (search?: string, limit = 20) => {

    let where: any = {};

    if (search) {
      where = {
        customerName: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        customerName: true,
      },
      distinct: ['customerName'],
      orderBy: {
        customerName: 'asc',
      },
      take: limit,
    });

    return invoices.map((invoice) => invoice.customerName);
  },

};