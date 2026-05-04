import { useState, useCallback } from 'react';
import { Order, PaymentResponse } from '../types';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';

export interface OrderHistoryFilters {
  from: string;
  to: string;
  status: string;
  paymentStatus: string;
}

export const useOrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchOrders = useCallback(async (filters: OrderHistoryFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders({
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        paymentStatus: filters.paymentStatus || undefined,
      });
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openDetail = useCallback(async (order: Order) => {
    setSelectedOrder(order);
    setSelectedPayment(null);
    if (order.paymentStatus === 'paid') {
      setIsDetailLoading(true);
      try {
        const payment = await paymentService.getPayment(order.id);
        setSelectedPayment(payment);
      } catch {
        // Payment detail unavailable — show order without it
      } finally {
        setIsDetailLoading(false);
      }
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedOrder(null);
    setSelectedPayment(null);
  }, []);

  return {
    orders,
    isLoading,
    error,
    selectedOrder,
    selectedPayment,
    isDetailLoading,
    fetchOrders,
    openDetail,
    closeDetail,
  };
};
