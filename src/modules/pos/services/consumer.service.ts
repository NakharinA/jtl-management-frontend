import { apiClient } from '../../../services/api.client';
import { Consumer } from '../types';

export const consumerService = {
  getByPhone: async (phone: string): Promise<Consumer> => {
    return apiClient.get<Consumer>(`/pos/consumers/phone/${encodeURIComponent(phone)}`);
  },

  getById: async (id: string): Promise<Consumer> => {
    return apiClient.get<Consumer>(`/pos/consumers/${id}`);
  },

  register: async (phone: string, name: string): Promise<Consumer> => {
    return apiClient.post<Consumer>('/pos/consumers', { phone, name });
  },

  getAll: async (): Promise<Consumer[]> => {
    return apiClient.get<Consumer[]>('/pos/consumers');
  },
};
