import { api } from '@/api/client';
import type { Invoice } from '@/types/invoice.types';

type InvoiceFromApi = {
  id: string;
  invoiceNo: string;
  customerName: string;
  invoiceDate: string;
  amount: string | number;
  paidAmount: string | number;
  balance: string | number;
};

export function mapInvoice(raw: InvoiceFromApi): Invoice {
  return {
    id: raw.id,
    invoiceNo: raw.invoiceNo,
    customerId: '',
    customerName: raw.customerName,
    invoiceDate: String(raw.invoiceDate).slice(0, 10),
    amount: Number(raw.amount),
    paidAmount: Number(raw.paidAmount),
    balance: Number(raw.balance),
  };
}

export interface InvoicesPageResult {
  items: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchInvoicesRequest(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  order?: string;
} = {}): Promise<InvoicesPageResult> {
  const { page = 1, pageSize = 10, search, sortBy, order } = params;
  const res = await api.get('/api/invoices', {
    params: { page, pageSize, search: search || undefined, sortBy: sortBy || undefined, order: order || undefined },
  });
  const payload = res.data?.data as {
    items: InvoiceFromApi[];
    total: number;
    page: number;
    pageSize: number;
  };
  const items = (payload?.items ?? []).map(mapInvoice);
  return { items, total: payload?.total ?? 0, page: payload?.page ?? page, pageSize: payload?.pageSize ?? pageSize };
}

export async function createInvoiceRequest(payload: {
  customerName: string;
  invoiceDate: string;
  amount: number;
}): Promise<Invoice> {
  const res = await api.post('/api/invoices', payload);
  return mapInvoice(res.data.data as InvoiceFromApi);
}

export async function updateInvoiceRequest(
  id: string,
  payload: { customerName?: string; invoiceDate?: string; amount?: number }
): Promise<Invoice> {
  const res = await api.put(`/api/invoices/${id}`, payload);
  return mapInvoice(res.data.data as InvoiceFromApi);
}

export async function deleteInvoiceRequest(id: string): Promise<string> {
  await api.delete(`/api/invoices/${id}`);
  return id;
}