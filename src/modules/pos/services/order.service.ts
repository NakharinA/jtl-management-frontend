import { apiClient } from '../../../services/api.client';
import { CheckoutPreview, Order } from '../types';

export const orderService = {
  getOrders: async (params?: {
    from?: string;
    to?: string;
    status?: string;
    paymentStatus?: string;
  }): Promise<Order[]> => {
    const query: Record<string, string> = {};
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    if (params?.status) query.status = params.status;
    if (params?.paymentStatus) query.paymentStatus = params.paymentStatus;
    return apiClient.get<Order[]>('/pos/orders', Object.keys(query).length ? query : undefined);
  },

  checkoutPreview: async (
    cartId: string,
    taxRate = 0,
    discount = 0,
  ): Promise<CheckoutPreview> => {
    return apiClient.post<CheckoutPreview>('/pos/checkout', {
      cartId,
      taxRate,
      discount,
    });
  },

  confirmOrder: async (
    cartId: string,
    taxRate = 0,
    discount = 0,
  ): Promise<Order> => {
    return apiClient.post<Order>('/pos/orders', {
      cartId,
      taxRate,
      discount,
    });
  },

  getOrder: async (orderId: string): Promise<Order> => {
    return apiClient.get<Order>(`/pos/orders/${orderId}`);
  },
};
