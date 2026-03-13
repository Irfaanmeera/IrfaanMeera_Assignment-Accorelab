import { api } from '@/api/client';

export async function fetchCustomerNamesRequest(params: {
  search?: string;
  limit?: number;
} = {}): Promise<string[]> {
  const { search, limit = 20 } = params;
  const res = await api.get('/api/invoices/customer-names', {
    params: { search: search || undefined, limit },
  });
  const data = res.data?.data as { names?: string[] };
  return data?.names ?? [];
}
