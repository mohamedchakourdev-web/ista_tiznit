import { apiClient } from './client';
import type { Absence, ApiCollectionResponse, ApiResponse, Groupe, QueryParams, Stagiaire } from '@/types';

export const formateurService = {
  groupes(params?: QueryParams) {
    return apiClient.get<ApiCollectionResponse<Groupe>>('/formateur/groupes', { params }).then((res) => res.data);
  },

  groupe(id: number) {
    return apiClient.get<ApiResponse<Groupe>>(`/formateur/groupes/${id}`).then((res) => res.data);
  },

  stagiaires(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Stagiaire>>('/formateur/stagiaires', { params })
      .then((res) => res.data);
  },

  stagiaire(id: number) {
    return apiClient.get<ApiResponse<Stagiaire>>(`/formateur/stagiaires/${id}`).then((res) => res.data);
  },

  absences(params?: QueryParams) {
    return apiClient.get<ApiCollectionResponse<Absence>>('/formateur/absences', { params }).then((res) => res.data);
  },

  absence(id: number) {
    return apiClient.get<ApiResponse<Absence>>(`/formateur/absences/${id}`).then((res) => res.data);
  },
};
