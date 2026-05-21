import { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react';
import { loadFromStorage, saveToStorage, KEYS } from '@/utils/storage';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics/ga4';

const CartContext = createContext(null);

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
    (product, quantity = 1) => {
      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
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
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== productId) return i;
        const q = quantity <= 0 ? 0 : Math.max(1, parseInt(quantity, 10) || 1);
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
    setItems((prev) =>
      prev
        .map((i) => (i.id === productId ? { ...i, quantity: i.quantity - amount } : i))
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
