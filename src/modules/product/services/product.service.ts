import { apiClient } from '../../../services/api.client';
import { Product, PriceLog, CreateProductPayload, UpdateProductPayload } from '../types';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    return apiClient.get<Product[]>('/product');
  },

  getById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/product/${id}`);
  },

  create: async (data: CreateProductPayload): Promise<Product> => {
    return apiClient.post<Product>('/product', data);
  },

  update: async (id: string, data: UpdateProductPayload): Promise<Product> => {
    return apiClient.put<Product>(`/product/${id}`, data);
  },

  delete: async (id: string): Promise<{ id: string }> => {
    return apiClient.delete<{ id: string }>(`/product/${id}`);
  },

  getPriceLogs: async (id: string): Promise<PriceLog[]> => {
    return apiClient.get<PriceLog[]>(`/product/${id}/price-logs`);
  },
};
