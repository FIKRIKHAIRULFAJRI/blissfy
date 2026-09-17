import { apiClient } from './api-client';

export const flashSalesApi = {
  async list() {
    return apiClient.get<any[]>('/v1/admin/flash-sales');
  },
  async create(data: any) {
    return apiClient.post<any>('/v1/admin/flash-sales', data);
  },
  async delete(id: string) {
    return apiClient.delete(`/v1/admin/flash-sales/${id}`);
  },
};
