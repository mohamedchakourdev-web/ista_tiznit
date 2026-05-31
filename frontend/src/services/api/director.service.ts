import { apiClient } from './client';
import type {
  ApiCollectionResponse,
  ApiResponse,
  DirectorOverview,
  QueryParams,
  StoreUserPayload,
  UpdateUserPayload,
  User,
} from '@/types';

export const directorService = {
  overview() {
    return apiClient.get<ApiResponse<DirectorOverview>>('/director/overview').then((res) => res.data);
  },

  users(params?: QueryParams) {
    return apiClient.get<ApiCollectionResponse<User>>('/directeur/users', { params }).then((res) => res.data);
  },

  user(id: number) {
    return apiClient.get<ApiResponse<User>>(`/directeur/users/${id}`).then((res) => res.data);
  },

  createUser(payload: StoreUserPayload) {
    return apiClient.post<ApiResponse<User>>('/directeur/users', payload).then((res) => res.data);
  },

  updateUser(id: number, payload: UpdateUserPayload) {
    return apiClient.put<ApiResponse<User>>(`/directeur/users/${id}`, payload).then((res) => res.data);
  },

  deleteUser(id: number) {
    return apiClient.delete<ApiResponse<Record<string, never>>>(`/directeur/users/${id}`).then((res) => res.data);
  },
};
