import { apiClient } from './client';
import type { ApiCollectionResponse, DiplomeType, QueryParams } from '@/types';

export const diplomeService = {
  list(params?: QueryParams) {
    return apiClient
      .get<ApiCollectionResponse<DiplomeType>>('/gestionnaire/diplome-types', { params })
      .then((res) => res.data);
  },
};
