import { apiClient } from './client';
import type { ApiResponse, UpdatePasswordPayload, UpdateProfilePayload, User } from '@/types';

export const profileService = {
  get() {
    return apiClient.get<ApiResponse<User>>('/profile').then((res) => res.data);
  },

  update(payload: UpdateProfilePayload) {
    return apiClient.put<ApiResponse<User>>('/profile', payload).then((res) => res.data);
  },

  updateAvatar(file: File) {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('avatar', file);

    return apiClient.post<ApiResponse<User>>('/profile/avatar', formData).then((res) => res.data);
  },

  updatePassword(payload: UpdatePasswordPayload) {
    return apiClient.put<ApiResponse<Record<string, never>>>('/profile/password', payload).then((res) => res.data);
  },
};
