import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cart, CartItem } from '../types';
import { cartService } from '../services/cart.service';
import { Product } from '../../product/types';

const CART_ID_KEY = 'pos_cart_id';

export const useCart = () => {
  const [cartId, setCartId] = useState<string | null>(
    () => localStorage.getItem(CART_ID_KEY),
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem(CART_ID_KEY);
    if (!storedId) return;
    setIsCartLoading(true);
    cartService
      .getCart(storedId)
      .then((cart) => {
        setCartId(cart.id);
        setItems(cart.items);
      })
      .catch((err: Error) => {
        // 404 or any error → start fresh
        if (err.message.includes('not found') || err.message.includes('404')) {
          localStorage.removeItem(CART_ID_KEY);
          setCartId(null);
          setItems([]);
        }
      })
      .finally(() => setIsCartLoading(false));
  }, []);

  const syncCart = useCallback((cart: Cart) => {
    setCartId(cart.id);
    setItems(cart.items);
    localStorage.setItem(CART_ID_KEY, cart.id);
  }, []);

  const addItem = useCallback(
    async (product: Product) => {
      setIsCartLoading(true);
      setCartError(null);
      try {
        let activeCartId = cartId;
        if (!activeCartId) {
          const newCart = await cartService.createCart();
          activeCartId = newCart.id;
          localStorage.setItem(CART_ID_KEY, activeCartId);
          setCartId(activeCartId);
        }
        const updated = await cartService.addItem(activeCartId, product.id, 1);
        syncCart(updated);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        setCartError(msg);
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartId, syncCart],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!cartId) return;
      setIsCartLoading(true);
      setCartError(null);
      try {
        if (quantity <= 0) {
          const updated = await cartService.removeItem(cartId, productId);
          syncCart(updated);
        } else {
          const updated = await cartService.updateItem(
            cartId,
            productId,
            quantity,
          );
          syncCart(updated);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        setCartError(msg);
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartId, syncCart],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!cartId) return;
      setIsCartLoading(true);
      setCartError(null);
      try {
        const updated = await cartService.removeItem(cartId, productId);
        syncCart(updated);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        setCartError(msg);
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartId, syncCart],
  );

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY);
    setCartId(null);
    setItems([]);
    setCartError(null);
  }, []);

  const dismissError = useCallback(() => setCartError(null), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  return {
    cartId,
    items,
    isCartLoading,
    cartError,
    subtotal,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    dismissError,
  };
};
