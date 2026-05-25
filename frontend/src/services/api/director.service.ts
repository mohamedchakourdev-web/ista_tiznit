import { apiClient } from './client';
import type { ApiCollectionResponse, ApiResponse, DirectorOverview, QueryParams, User } from '@/types';

export const directorService = {
  overview() {
    return apiClient.get<ApiResponse<DirectorOverview>>('/director/overview').then((res) => res.data);
  },

  users(params?: QueryParams) {
    return apiClient.get<ApiCollectionResponse<User>>('/director/users', { params }).then((res) => res.data);
  },

  user(id: number) {
    return apiClient.get<ApiResponse<User>>(`/director/users/${id}`).then((res) => res.data);
  },
};
