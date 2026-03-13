import { api } from '@/api/client';



export async function loginRequest(payload: { email: string; password: string }) {
  const res = await api.post('/api/auth/login', payload);
  if (!res.data.data) throw new Error('Unexpected login response');
  return res.data.data;
}

export async function profileRequest() {
  const res = await api.get('/api/auth/profile');
  return res.data.data;
}

