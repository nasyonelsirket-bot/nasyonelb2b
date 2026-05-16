import { createContext, useContext, useCallback, useState, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cartAnimating, setCartAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 500);
  }, []);

  const addToCart = useCallback(
    (product, quantity = null) => {
      const qty = quantity ?? product.minOrder ?? 1;
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [...prev, { ...product, quantity: qty }];
      });
      triggerAnimation();
    },
    [triggerAnimation],
  );

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity } : i)),
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
        .map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity - amount } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const minOrderViolations = useMemo(() => {
    return items
      .filter((i) => i.quantity < (i.minOrder || 1))
      .map((i) => ({
        id: i.id,
        name: i.name,
        minOrder: i.minOrder || 1,
        quantity: i.quantity,
      }));
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
