import { useState, useCallback } from 'react';
import {
  CartItem,
  Order,
  PaymentMethod,
  PaymentResponse,
  ProcessPaymentRequest,
} from '../types';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { isApiError } from '../../../services/api.client';

export type CheckoutStep =
  | 'IDLE'
  | 'PAYMENT_FORM'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'BLOCKED' // 409 repurchase period — order exists but cannot be paid
  | 'ERROR';

export interface CheckoutState {
  step: CheckoutStep;
  paymentMethod: PaymentMethod | null;
  paymentResult: PaymentResponse | null;
  errorMessage: string | null;
  /**
   * Order created on the server but not yet paid.
   * Retrying payment re-uses it instead of creating a second order.
   */
  pendingOrder: Order | null;
}

interface CheckoutOptions {
  /** Called when POST /pos/orders rejects with 400 because consumerId is missing. */
  onConsumerRequired?: (method: PaymentMethod, message: string) => void;
}

const IDLE_STATE: CheckoutState = {
  step: 'IDLE',
  paymentMethod: null,
  paymentResult: null,
  errorMessage: null,
  pendingOrder: null,
};

const isConsumerRequiredError = (err: unknown) =>
  isApiError(err, 400) && /consumer/i.test(err.message);

const isRepurchaseBlockedError = (err: unknown) =>
  isApiError(err, 409) && /repurchase/i.test(err.message);

/**
 * Checkout makes two calls: POST /pos/orders (items sent inline from the local
 * cart) and POST /pos/orders/:id/payment. No /pos/checkout preview: the cart
 * total is computed locally.
 */
export const useCheckout = (
  items: CartItem[],
  clearCart: () => void,
  consumerId: string | null = null,
  options: CheckoutOptions = {},
) => {
  const { onConsumerRequired } = options;
  const [state, setState] = useState<CheckoutState>(IDLE_STATE);

  const openCheckout = useCallback((method: PaymentMethod) => {
    setState({ ...IDLE_STATE, step: 'PAYMENT_FORM', paymentMethod: method });
  }, []);

  const confirmCheckout = useCallback(
    async (paymentDetails: Omit<ProcessPaymentRequest, 'method'>) => {
      const method = state.paymentMethod;
      if (!method || (items.length === 0 && !state.pendingOrder)) return;

      setState((prev) => ({ ...prev, step: 'PROCESSING' }));

      // Step 1: Create the order from the local cart (server locks prices).
      // Skipped when a previous attempt already created the order.
      let order = state.pendingOrder;
      if (!order) {
        try {
          order = await orderService.confirmOrder(
            items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            0,
            0,
            consumerId ?? undefined,
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างออเดอร์';
          if (isConsumerRequiredError(err) && onConsumerRequired) {
            setState(IDLE_STATE);
            onConsumerRequired(method, msg);
            return;
          }
          setState((prev) => ({ ...prev, step: 'ERROR', errorMessage: msg }));
          return;
        }
        const created = order;
        setState((prev) => ({ ...prev, pendingOrder: created }));
      }

      // Step 2: Process payment
      try {
        const body: ProcessPaymentRequest =
          method === 'cash'
            ? {
                method: 'cash',
                amountTendered: (paymentDetails as { amountTendered: number })
                  .amountTendered,
              }
            : {
                method,
                referenceNumber: (
                  paymentDetails as { referenceNumber: string }
                ).referenceNumber,
              };

        const result = await paymentService.processPayment(order.id, body);

        clearCart();

        setState({
          step: 'SUCCESS',
          paymentMethod: method,
          paymentResult: result,
          errorMessage: null,
          pendingOrder: null,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการชำระเงิน';
        const unpaid = order;
        setState((prev) => ({
          ...prev,
          step: isRepurchaseBlockedError(err) ? 'BLOCKED' : 'ERROR',
          errorMessage: msg,
          pendingOrder: unpaid,
        }));
      }
    },
    [items, consumerId, state.paymentMethod, state.pendingOrder, clearCart, onConsumerRequired],
  );

  const retryCheckout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'PAYMENT_FORM',
      errorMessage: null,
      paymentResult: null,
    }));
  }, []);

  /** Resets the dialog. Callers must handle `pendingOrder` (see POSSalesPage). */
  const closeCheckout = useCallback(() => {
    setState(IDLE_STATE);
  }, []);

  return {
    ...state,
    openCheckout,
    cancelCheckout: closeCheckout,
    confirmCheckout,
    retryCheckout,
    closeCheckout,
  };
};
