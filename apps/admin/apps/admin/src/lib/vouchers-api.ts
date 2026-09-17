import { apiClient } from './api-client';

export const vouchersApi = {
  async list() {
    return apiClient.get<any[]>('/v1/admin/vouchers');
  },
  async create(data: any) {
    return apiClient.post<any>('/v1/admin/vouchers', data);
  },
  async delete(id: string) {
    return apiClient.delete(`/v1/admin/vouchers/${id}`);
  },
};
