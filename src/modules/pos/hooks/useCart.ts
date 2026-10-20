import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem } from '../types';
import { Product } from '../../product/types';

/**
 * The POS cart lives only in the browser: adding, changing and removing items
 * makes no API calls. The server sees the items once, at checkout
 * (POST /pos/orders with the items inline).
 *
 * The in-progress cart is kept in localStorage so a page refresh does not lose it.
 */
const STORAGE_KEY = 'pos_local_cart';
// Keys of the old server-side cart; removed on load.
const LEGACY_KEYS = ['pos_cart_id', 'pos_controlled_ids'];

function loadItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        !!i &&
        typeof i.productId === 'string' &&
        typeof i.productName === 'string' &&
        typeof i.quantity === 'number' &&
        i.quantity > 0 &&
        typeof i.unitPrice === 'number',
    );
  } catch {
    return [];
  }
}

function saveItems(items: CartItem[]): void {
  try {
    if (items.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable: the cart still works for this page view.
  }
}

/** Same price the backend uses for POS lines (product retail price). */
function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    productName: product.productName,
    quantity,
    unitPrice: Number(product.retailPrice),
    isControlled: !!product.isControlled,
    maxAmountPerOrder: product.maxAmountPerOrder ?? undefined,
  };
}

/** Mirrors the backend's per-order limit for controlled products. */
function limitError(item: CartItem, quantity: number): string | null {
  if (
    item.isControlled &&
    item.maxAmountPerOrder != null &&
    quantity > item.maxAmountPerOrder
  ) {
    return `สินค้าควบคุม "${item.productName}" ซื้อได้สูงสุด ${item.maxAmountPerOrder} ชิ้นต่อออเดอร์`;
  }
  return null;
}

/**
 * @param products product list already loaded on the page; used to refresh
 *   names/prices of a restored cart and to look up controlled-product rules.
 */
export const useCart = (products: Product[] = []) => {
  const [items, setItems] = useState<CartItem[]>(loadItems);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    try {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Once products are loaded, bring stored lines up to date (price, name,
  // controlled flags) so the cart shows what the backend will charge.
  useEffect(() => {
    if (products.length === 0) return;
    const byId = new Map(products.map((p) => [p.id, p]));
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const product = byId.get(item.productId);
        if (!product) return item;
        const fresh = toCartItem(product, item.quantity);
        if (
          fresh.unitPrice !== item.unitPrice ||
          fresh.productName !== item.productName ||
          fresh.isControlled !== item.isControlled ||
          fresh.maxAmountPerOrder !== item.maxAmountPerOrder
        ) {
          changed = true;
          return fresh;
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [products]);

  const addItem = useCallback((product: Product) => {
    setCartError(null);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const candidate = toCartItem(product, (existing?.quantity ?? 0) + 1);
      const error = limitError(candidate, candidate.quantity);
      if (error) {
        setCartError(error);
        return prev;
      }
      return existing
        ? prev.map((i) => (i.productId === product.id ? candidate : i))
        : [...prev, candidate];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartError(null);
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      const error = limitError(item, quantity);
      if (error) {
        setCartError(error);
        return prev;
      }
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartError(null);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCartError(null);
  }, []);

  /**
   * Puts previously ordered items back into the cart. Used when an order was
   * created but could not be paid, so the cashier can edit the items and
   * check out again.
   */
  const restoreItems = useCallback(
    (toRestore: { productId: string; productName: string; quantity: number; unitPrice: number }[]) => {
      const byId = new Map(products.map((p) => [p.id, p]));
      setCartError(null);
      setItems(
        toRestore
          .filter((i) => i.quantity > 0)
          .map((i) => {
            const product = byId.get(i.productId);
            return product
              ? toCartItem(product, i.quantity)
              : {
                  productId: i.productId,
                  productName: i.productName,
                  quantity: i.quantity,
                  unitPrice: Number(i.unitPrice),
                };
          }),
      );
    },
    [products],
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

  const cartHasControlled = useMemo(() => items.some((i) => i.isControlled), [items]);

  return {
    items,
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
