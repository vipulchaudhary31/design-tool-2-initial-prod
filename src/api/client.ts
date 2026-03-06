import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'auth_token';
export const getToken   = () => localStorage.getItem(TOKEN_KEY);
export const setToken   = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── Shared response error handler ─────────────────────────────────────────────
function handleResponseError(error: any) {
  if (error.response?.status === 401) {
    clearToken();
  }
  const message =
    error.response?.data?.message ??
    error.response?.data?.error ??
    error.message ??
    'Request failed';
  return Promise.reject(new Error(message));
}

// ── Main API client (test API) ────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

apiClient.interceptors.response.use((r) => r, handleResponseError);
