import { useState, useCallback } from 'react';
import { Consumer } from '../types';
import { consumerService } from '../services/consumer.service';

export type ConsumerStep =
  | 'PHONE_INPUT'
  | 'LOOKING_UP'
  | 'FOUND'
  | 'NOT_FOUND'
  | 'REGISTERING';

interface ConsumerState {
  step: ConsumerStep;
  phone: string;
  consumer: Consumer | null;
  error: string | null;
}

export const useConsumer = () => {
  const [state, setState] = useState<ConsumerState>({
    step: 'PHONE_INPUT',
    phone: '',
    consumer: null,
    error: null,
  });

  const setPhone = useCallback((phone: string) => {
    setState((prev) => ({ ...prev, phone, error: null }));
  }, []);

  const lookup = useCallback(async (phone: string) => {
    setState((prev) => ({ ...prev, step: 'LOOKING_UP', error: null }));
    try {
      const consumer = await consumerService.getByPhone(phone);
      setState((prev) => ({ ...prev, step: 'FOUND', consumer }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setState((prev) => ({ ...prev, step: 'NOT_FOUND', consumer: null }));
      } else {
        setState((prev) => ({ ...prev, step: 'PHONE_INPUT', error: msg }));
      }
    }
  }, []);

  const register = useCallback(async (name: string) => {
    setState((prev) => ({ ...prev, step: 'REGISTERING', error: null }));
    try {
      const consumer = await consumerService.register(state.phone, name);
      setState((prev) => ({ ...prev, step: 'FOUND', consumer }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409') || msg.toLowerCase().includes('already registered')) {
        // Auto-retry lookup — phone already exists, just fetch it
        lookup(state.phone);
      } else {
        setState((prev) => ({ ...prev, step: 'NOT_FOUND', error: msg }));
      }
    }
  }, [state.phone, lookup]);

  const reset = useCallback(() => {
    setState({ step: 'PHONE_INPUT', phone: '', consumer: null, error: null });
  }, []);

  return {
    ...state,
    setPhone,
    lookup,
    register,
    reset,
  };
};
