import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cart, CartItem } from '../types';
import { cartService } from '../services/cart.service';
import { Product } from '../../product/types';

const CART_ID_KEY = 'pos_cart_id';
const CONTROLLED_IDS_KEY = 'pos_controlled_ids';

function loadControlledIds(): Set<string> {
  try {
    const raw = localStorage.getItem(CONTROLLED_IDS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveControlledIds(ids: Set<string>): void {
  localStorage.setItem(CONTROLLED_IDS_KEY, JSON.stringify([...ids]));
}

export const useCart = () => {
  const [cartId, setCartId] = useState<string | null>(
    () => localStorage.getItem(CART_ID_KEY),
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [controlledIds, setControlledIds] = useState<Set<string>>(loadControlledIds);
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
    // Prune controlled IDs that are no longer in the cart
    setControlledIds((prev) => {
      const cartProductIds = new Set(cart.items.map((i) => i.productId));
      const next = new Set([...prev].filter((id) => cartProductIds.has(id)));
      saveControlledIds(next);
      return next;
    });
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
        if (product.isControlled) {
          setControlledIds((prev) => {
            const next = new Set(prev).add(product.id);
            saveControlledIds(next);
            return next;
          });
        }
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
    localStorage.removeItem(CONTROLLED_IDS_KEY);
    setCartId(null);
    setItems([]);
    setControlledIds(new Set());
    setCartError(null);
  }, []);

  /**
   * Rebuilds a fresh server cart from previously ordered items. Used when an
   * order was created (which deletes the server cart) but could not be paid,
   * so the cashier can edit the items and check out again.
   */
  const restoreItems = useCallback(
    async (toRestore: { productId: string; quantity: number }[]) => {
      setIsCartLoading(true);
      setCartError(null);
      let cart: Cart | null = null;
      try {
        cart = await cartService.createCart();
        localStorage.setItem(CART_ID_KEY, cart.id);
        for (const item of toRestore) {
          cart = await cartService.addItem(cart.id, item.productId, item.quantity);
        }
        syncCart(cart);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        setCartError(`ไม่สามารถกู้คืนตะกร้าได้ครบ: ${msg}`);
        if (cart) {
          syncCart(cart);
        } else {
          localStorage.removeItem(CART_ID_KEY);
          setCartId(null);
          setItems([]);
        }
      } finally {
        setIsCartLoading(false);
      }
    },
    [syncCart],
  );

  const dismissError = useCallback(() => setCartError(null), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const cartHasControlled = controlledIds.size > 0;

  return {
    cartId,
    items,
    isCartLoading,
    cartError,
    subtotal,
    itemCount,
    cartHasControlled,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    restoreItems,
    dismissError,
  };
};
