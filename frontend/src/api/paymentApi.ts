import { api } from '@/api/client';
import { mapInvoice } from '@/api/invoiceApi';
import type { Invoice } from '@/types/invoice.types';
import type { Payment } from '@/types/payment.types';

type PaymentRaw = { id: string; receiptNo: string; paymentDate: string; amount: number; method: string; invoiceId: string; invoice?: { invoiceNo: string } };

export interface PaymentsPageResult {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
}

function mapPayment(raw: PaymentRaw): Payment {
  return {
    id: raw.id,
    receiptNo: raw.receiptNo,
    paymentDate: String(raw.paymentDate).slice(0, 10),
    invoiceId: raw.invoiceId,
    invoiceNo: raw.invoice?.invoiceNo ?? '',
    amount: Number(raw.amount),
    method: raw.method as Payment['method'],
  };
}

export async function fetchPaymentsRequest(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  order?: string;
} = {}): Promise<PaymentsPageResult> {
  const { page = 1, pageSize = 10, search, sortBy, order } = params;
  const res = await api.get('/api/payments', {
    params: { page, pageSize, search: search || undefined, sortBy: sortBy || undefined, order: order || undefined },
  });
  const payload = res.data?.data as { items: PaymentRaw[]; total: number; page: number; pageSize: number };
  const items = (payload?.items ?? []).map(mapPayment);
  return { items, total: payload?.total ?? 0, page: payload?.page ?? page, pageSize: payload?.pageSize ?? pageSize };
}

export async function createPaymentRequest(payload: {
  paymentDate: string;
  invoiceId: string;
  amount: number;
  method: string;
}) {
  const res = await api.post('/api/payments', payload);
  const raw = res.data.data as { payment: PaymentRaw; invoice: { id: string; invoiceNo: string; customerName: string; invoiceDate: string; amount: string | number; paidAmount: string | number; balance: string | number } };
  const payment = mapPayment({ ...raw.payment, invoice: { invoiceNo: raw.invoice.invoiceNo } });
  const invoice: Invoice = mapInvoice(raw.invoice);
  return { payment, invoice };
}

export async function updatePaymentRequest(id: string, payload: { paymentDate?: string; amount?: number; method?: string }) {
  const res = await api.patch(`/api/payments/${id}`, payload);
  const raw = res.data.data as { payment: PaymentRaw; invoice: { invoiceNo: string } };
  return mapPayment({ ...raw.payment, invoice: raw.invoice });
}

export async function deletePaymentRequest(id: string) {
  await api.delete(`/api/payments/${id}`);
  return id;
}