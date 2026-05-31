import { apiClient } from './client';
import type {
  ApiCollectionResponse,
  ApiResponse,
  Groupe,
  QueryParams,
  StoreGroupePayload,
  UpdateGroupePayload,
  User,
} from '@/types';

export const groupeService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Groupe>>('/gestionnaire/groupes', { params })
      .then((res) => res.data);
  },

  get(id: number) {
    return apiClient.get<ApiResponse<Groupe>>(`/gestionnaire/groupes/${id}`).then((res) => res.data);
  },

  formateurs(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<User>>('/gestionnaire/formateurs', { params })
      .then((res) => res.data);
  },

  create(payload: StoreGroupePayload) {
    return apiClient.post<ApiResponse<Groupe>>('/gestionnaire/groupes', payload).then((res) => res.data);
  },

  update(id: number, payload: UpdateGroupePayload) {
    return apiClient.patch<ApiResponse<Groupe>>(`/gestionnaire/groupes/${id}`, payload).then((res) => res.data);
  },
  
  delete(id: number) {
    return apiClient.delete<ApiResponse<Record<string, never>>>(`/gestionnaire/groupes/${id}`).then((res) => res.data);
  },
};
