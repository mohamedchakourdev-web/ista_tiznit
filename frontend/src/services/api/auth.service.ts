import { apiClient } from './client';
import type { ApiResponse, LoginPayload, LoginResponse, User } from '@/types';

export const authService = {
  login(payload: LoginPayload) {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload).then((res) => res.data);
  },

  me() {
    return apiClient.get<ApiResponse<User>>('/auth/me').then((res) => res.data);
  },

  logout() {
    return apiClient.post<ApiResponse<Record<string, never>>>('/auth/logout').then((res) => res.data);
  },

  forgotPassword(email: string) {
    return apiClient.post<ApiResponse<unknown>>('/auth/forgot-password', { email }).then((res) => res.data);
  },
};
