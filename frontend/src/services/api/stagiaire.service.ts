import { apiClient } from './client';
import type {
  ApiCollectionResponse,
  ApiResponse,
  QueryParams,
  Stagiaire,
  StoreStagiairePayload,
  UpdateStagiairePayload,
} from '@/types';

export const stagiaireService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Stagiaire>>('/gestionnaire/stagiaires', { params })
      .then((res) => res.data);
  },

  get(id: number) {
    return apiClient.get<ApiResponse<Stagiaire>>(`/gestionnaire/stagiaires/${id}`).then((res) => res.data);
  },

  create(payload: StoreStagiairePayload) {
    return apiClient.post<ApiResponse<Stagiaire>>('/gestionnaire/stagiaires', payload).then((res) => res.data);
  },

  update(id: number, payload: UpdateStagiairePayload) {
    return apiClient.patch<ApiResponse<Stagiaire>>(`/gestionnaire/stagiaires/${id}`, payload).then((res) => res.data);
  },

  import(file: File, onUploadProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient
      .post<ApiResponse<never>>('/gestionnaire/stagiaires/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total || !onUploadProgress) return;
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((res) => res.data);
  },
  
  delete(id: number) {
    return apiClient.delete<ApiResponse<never>>(`/gestionnaire/stagiaires/${id}`).then((res) => res.data);
  },
};
