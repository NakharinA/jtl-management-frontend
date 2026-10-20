import { apiClient } from '../../../services/api.client';
import { Order, OrderLineInput } from '../types';

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

  /**
   * Creates the order from the local cart. Items are sent inline; prices are
   * taken from the products on the server (retail price).
   */
  confirmOrder: async (
    items: OrderLineInput[],
    taxRate = 0,
    discount = 0,
    consumerId?: string,
  ): Promise<Order> => {
    return apiClient.post<Order>('/pos/orders', {
      items,
      taxRate,
      discount,
      ...(consumerId ? { consumerId } : {}),
    });
  },

  getOrder: async (orderId: string): Promise<Order> => {
    return apiClient.get<Order>(`/pos/orders/${orderId}`);
  },

  /** Cancels an unpaid order (409 when it is already paid). */
  cancelOrder: async (orderId: string): Promise<Order> => {
    return apiClient.post<Order>(`/pos/orders/${orderId}/cancel`, {});
  },
};
