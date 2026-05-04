import { useState, useCallback } from 'react';
import { PaymentMethod, PaymentResponse, ProcessPaymentRequest } from '../types';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';

export type CheckoutStep =
  | 'IDLE'
  | 'PAYMENT_FORM'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'ERROR';

export interface CheckoutState {
  step: CheckoutStep;
  paymentMethod: PaymentMethod | null;
  paymentResult: PaymentResponse | null;
  errorMessage: string | null;
}

export const useCheckout = (
  cartId: string | null,
  clearCart: () => void,
) => {
  const [state, setState] = useState<CheckoutState>({
    step: 'IDLE',
    paymentMethod: null,
    paymentResult: null,
    errorMessage: null,
  });

  const openCheckout = useCallback((method: PaymentMethod) => {
    setState({
      step: 'PAYMENT_FORM',
      paymentMethod: method,
      paymentResult: null,
      errorMessage: null,
    });
  }, []);

  const cancelCheckout = useCallback(() => {
    setState({
      step: 'IDLE',
      paymentMethod: null,
      paymentResult: null,
      errorMessage: null,
    });
  }, []);

  const confirmCheckout = useCallback(
    async (paymentDetails: Omit<ProcessPaymentRequest, 'method'>) => {
      if (!cartId || !state.paymentMethod) return;

      setState((prev) => ({ ...prev, step: 'PROCESSING' }));

      try {
        // Step 1: Confirm order (locks prices, deletes cart on server)
        const order = await orderService.confirmOrder(cartId);

        // Step 2: Process payment
        const body: ProcessPaymentRequest =
          state.paymentMethod === 'cash'
            ? {
                method: 'cash',
                amountTendered: (paymentDetails as { amountTendered: number })
                  .amountTendered,
              }
            : {
                method: state.paymentMethod as 'qr' | 'card',
                referenceNumber: (
                  paymentDetails as { referenceNumber: string }
                ).referenceNumber,
              };

        const result = await paymentService.processPayment(order.id, body);

        clearCart();

        setState({
          step: 'SUCCESS',
          paymentMethod: state.paymentMethod,
          paymentResult: result,
          errorMessage: null,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการชำระเงิน';
        setState((prev) => ({
          ...prev,
          step: 'ERROR',
          errorMessage: msg,
        }));
      }
    },
    [cartId, state.paymentMethod, clearCart],
  );

  const retryCheckout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'PAYMENT_FORM',
      errorMessage: null,
      paymentResult: null,
    }));
  }, []);

  const closeCheckout = useCallback(() => {
    setState({
      step: 'IDLE',
      paymentMethod: null,
      paymentResult: null,
      errorMessage: null,
    });
  }, []);

  return {
    ...state,
    openCheckout,
    cancelCheckout,
    confirmCheckout,
    retryCheckout,
    closeCheckout,
  };
};
