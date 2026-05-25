import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface ApiErrorPayload {
  success?: false;
  message?: string;
  errors?: Record<string, string[]>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

function clearBrowserSession() {
  window.localStorage.removeItem('ofppt_token');
  window.localStorage.removeItem('ofppt_user');
  document.cookie = 'ofppt_auth=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'ofppt_role=; Path=/; Max-Age=0; SameSite=Lax';
}

function normalizePaginatedResponse(response: AxiosResponse) {
  const payload = response.data;
  if (!payload || typeof payload !== 'object') return response;

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object' || !Array.isArray((data as { data?: unknown }).data)) {
    return response;
  }

  response.data = {
    ...payload,
    data: (data as { data: unknown[] }).data,
    links: (data as { links?: unknown }).links ?? (payload as { links?: unknown }).links,
    meta: (data as { meta?: unknown }).meta ?? (payload as { meta?: unknown }).meta,
  };

  return response;
}

apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const token = window.localStorage.getItem('ofppt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => normalizePaginatedResponse(response),
  (error: AxiosError<ApiErrorPayload>) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      clearBrowserSession();

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export function requestConfig(config?: AxiosRequestConfig): AxiosRequestConfig | undefined {
  return config;
}

export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const errors = error.response?.data?.errors;
    if (errors) {
      const first = Object.values(errors).flat().filter(Boolean)[0];
      if (first) return first;
    }

    if (error.response?.data?.message) return error.response.data.message;

    const statusMessages: Record<number, string> = {
      401: 'Session expiree. Veuillez vous reconnecter.',
      403: 'Acces refuse.',
      404: 'Ressource introuvable.',
      422: 'Les donnees envoyees sont invalides.',
      500: 'Erreur serveur. Veuillez reessayer plus tard.',
    };

    return error.response?.status ? statusMessages[error.response.status] ?? fallback : fallback;
  }

  return fallback;
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.errors ?? {};
  }

  return {};
}

export { API_BASE_URL };
