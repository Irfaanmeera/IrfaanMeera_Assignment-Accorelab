import type { AxiosInstance } from 'axios';
import { store } from '@/app/store';
import { logout } from '@/features/auth/authSlice';

export function axiosInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const token = store.getState().auth.token || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status;
      if (status === 401) {
        // Token invalid/expired (or login failed and backend uses 401).
        store.dispatch(logout());
      }
      return Promise.reject(err);
    }
  );
}

