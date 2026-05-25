import { apiClient } from './client';
import type {
  ApiCollectionResponse,
  ApiResponse,
  Autorisation,
  QueryParams,
  StoreAutorisationPayload,
  UpdateAutorisationStatusPayload,
} from '@/types';

export const autorisationService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Autorisation>>('/gestionnaire/autorisations', { params })
      .then((res) => res.data);
  },

  get(id: number) {
    return apiClient.get<ApiResponse<Autorisation>>(`/gestionnaire/autorisations/${id}`).then((res) => res.data);
  },

  create(payload: StoreAutorisationPayload) {
    return apiClient
      .post<ApiResponse<Autorisation>>('/gestionnaire/autorisations', payload)
      .then((res) => res.data);
  },

  formateurList(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Autorisation>>('/formateur/autorisations', { params })
      .then((res) => res.data);
  },

  formateurGet(id: number) {
    return apiClient.get<ApiResponse<Autorisation>>(`/formateur/autorisations/${id}`).then((res) => res.data);
  },

  updateStatus(id: number, payload: UpdateAutorisationStatusPayload) {
    return apiClient
      .patch<ApiResponse<Autorisation>>(`/formateur/autorisations/${id}/status`, payload)
      .then((res) => res.data);
  },
};
