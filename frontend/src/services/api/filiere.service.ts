import { apiClient } from './client';
import type {
  ApiCollectionResponse,
  ApiResponse,
  Filiere,
  QueryParams,
  StoreFilierePayload,
  UpdateFilierePayload,
} from '@/types';

export const filiereService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Filiere>>('/gestionnaire/filieres', { params })
      .then((res) => res.data);
  },

  get(id: number) {
    return apiClient.get<ApiResponse<Filiere>>(`/gestionnaire/filieres/${id}`).then((res) => res.data);
  },

  create(payload: StoreFilierePayload) {
    return apiClient.post<ApiResponse<Filiere>>('/gestionnaire/filieres', payload).then((res) => res.data);
  },

  update(id: number, payload: UpdateFilierePayload) {
    return apiClient.put<ApiResponse<Filiere>>(`/gestionnaire/filieres/${id}`, payload).then((res) => res.data);
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse<Record<string, never>>>(`/gestionnaire/filieres/${id}`).then((res) => res.data);
  },
};
