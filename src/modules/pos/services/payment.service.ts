import { apiClient } from '../../../services/api.client';
import { PaymentResponse, ProcessPaymentRequest } from '../types';

export const paymentService = {
  processPayment: async (
    orderId: string,
    body: ProcessPaymentRequest,
  ): Promise<PaymentResponse> => {
    return apiClient.post<PaymentResponse>(
      `/pos/orders/${orderId}/payment`,
      body,
    );
  },

  getPayment: async (orderId: string): Promise<PaymentResponse> => {
    return apiClient.get<PaymentResponse>(`/pos/orders/${orderId}/payment`);
  },
};
