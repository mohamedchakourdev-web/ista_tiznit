import { apiClient } from './client';
import type { Absence, ApiCollectionResponse, ApiResponse, QueryParams, StoreAbsencePayload } from '@/types';

export const absenceService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<Absence>>('/gestionnaire/absences', { params })
      .then((res) => res.data);
  },

  get(id: number) {
    return apiClient.get<ApiResponse<Absence>>(`/gestionnaire/absences/${id}`).then((res) => res.data);
  },

  create(payload: StoreAbsencePayload) {
    return apiClient.post<ApiResponse<Absence>>('/gestionnaire/absences', payload).then((res) => res.data);
  },
};
