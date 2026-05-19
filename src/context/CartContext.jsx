import { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '@/data/demoProducts';
import { loadFromStorage, saveToStorage, KEYS } from '@/utils/storage';
import { resolveMinQuantity, isLineValid, DEFAULT_MIN_LINE_VALUE_TL } from '@/utils/orderRules';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics/ga4';

const CartContext = createContext(null);

function getMinLineValue() {
  try {
    const s = loadFromStorage(KEYS.SETTINGS, {});
    const v = Number(s?.minOrderLineValue);
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_MIN_LINE_VALUE_TL;
  } catch {
    return DEFAULT_SETTINGS.minOrderLineValue || DEFAULT_MIN_LINE_VALUE_TL;
  }
}

function loadCartItems() {
  try {
    const raw = loadFromStorage(KEYS.CART, []);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCartItems);
  const [cartAnimating, setCartAnimating] = useState(false);

  useEffect(() => {
    saveToStorage(KEYS.CART, items);
  }, [items]);

  const triggerAnimation = useCallback(() => {
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 500);
  }, []);

  const addToCart = useCallback(
    (product, quantity = null) => {
      const minLineValue = getMinLineValue();
      const minQty = resolveMinQuantity(product, minLineValue);
      const qty = Math.max(quantity ?? minQty, minQty);
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: Math.max(i.quantity + qty, minQty) } : i,
          );
        }
        return [...prev, { ...product, quantity: qty }];
      });
      trackAddToCart(product, qty);
      triggerAnimation();
    },
    [triggerAnimation],
  );

  const setQuantity = useCallback((productId, quantity) => {
    const minLineValue = getMinLineValue();
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== productId) return i;
        const minQty = resolveMinQuantity(i, minLineValue);
        const q = quantity <= 0 ? 0 : Math.max(quantity, minQty);
        return { ...i, quantity: q };
      }),
    );
  }, []);

  const increment = useCallback(
    (productId, amount = 1) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity + amount } : i,
        ),
      );
      triggerAnimation();
    },
    [triggerAnimation],
  );

  const decrement = useCallback((productId, amount = 1) => {
    const minLineValue = getMinLineValue();
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id !== productId) return i;
          const minQty = resolveMinQuantity(i, minLineValue);
          return { ...i, quantity: i.quantity - amount };
        })
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === productId);
      if (item) trackRemoveFromCart(item, item.quantity);
      return prev.filter((i) => i.id !== productId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => trackRemoveFromCart(item, item.quantity));
      return [];
    });
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const minOrderViolations = useMemo(() => {
    const minLineValue = getMinLineValue();
    return items
      .filter((i) => !isLineValid(i, minLineValue))
      .map((i) => {
        const minQty = resolveMinQuantity(i, minLineValue);
        const lineTotal = i.price * i.quantity;
        const requiredTotal = i.price * minQty;
        return {
          id: i.id,
          name: i.name,
          minOrder: minQty,
          quantity: i.quantity,
          lineTotal,
          requiredTotal,
          minLineValue,
        };
      });
  }, [items]);

  const isCartValid = minOrderViolations.length === 0;

  return (
    <CartContext.Provider
      value={{
        items,
        cartAnimating,
        addToCart,
        setQuantity,
        increment,
        decrement,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        minOrderViolations,
        isCartValid,
        getMinLineValue,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
