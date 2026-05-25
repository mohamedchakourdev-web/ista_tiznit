import { apiClient } from './client';
import type { ApiCollectionResponse, ApiResponse, Notification, QueryParams } from '@/types';

export const notificationService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Notification>>('/notifications', { params })
      .then((res) => res.data);
  },

  unread(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Notification>>('/notifications/unread', { params })
      .then((res) => res.data);
  },

  markAsRead(id: number) {
    return apiClient.post<ApiResponse<Notification>>(`/notifications/${id}/read`).then((res) => res.data);
  },

  markAllAsRead() {
    return apiClient.post<ApiResponse<never>>('/notifications/read-all').then((res) => res.data);
  },
};
