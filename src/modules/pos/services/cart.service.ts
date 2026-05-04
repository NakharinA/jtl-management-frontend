import { apiClient } from '../../../services/api.client';
import { Cart } from '../types';

export const cartService = {
  createCart: async (): Promise<Cart> => {
    return apiClient.post<Cart>('/pos/cart', {});
  },

  getCart: async (cartId: string): Promise<Cart> => {
    return apiClient.get<Cart>(`/pos/cart/${cartId}`);
  },

  addItem: async (
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> => {
    return apiClient.post<Cart>(`/pos/cart/${cartId}/items`, {
      productId,
      quantity,
    });
  },

  updateItem: async (
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> => {
    return apiClient.put<Cart>(`/pos/cart/${cartId}/items/${productId}`, {
      quantity,
    });
  },

  removeItem: async (cartId: string, productId: string): Promise<Cart> => {
    return apiClient.delete<Cart>(
      `/pos/cart/${cartId}/items/${productId}`,
    );
  },

  deleteCart: async (cartId: string): Promise<{ id: string }> => {
    return apiClient.delete<{ id: string }>(`/pos/cart/${cartId}`);
  },
};
