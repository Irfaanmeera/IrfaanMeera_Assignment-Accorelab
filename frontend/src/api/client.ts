import axios from 'axios';

// In dev: use '' so requests hit Vite proxy (no CORS preflight).
// In production: use VITE_API_URL or fallback.
const baseURL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

