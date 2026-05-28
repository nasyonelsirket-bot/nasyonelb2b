import { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react';
import { loadFromStorage, saveToStorage, KEYS } from '@/utils/storage';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics/ga4';
import { trackMetaAddToCart } from '@/lib/analytics/meta';
import { getCartSubtotal } from '@/utils/cartLinePricing';
import { clampQtyToMin } from '@/utils/minOrderQty';

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
  const [addedToast, setAddedToast] = useState(null);

  const dismissAddedToast = useCallback(() => setAddedToast(null), []);

  useEffect(() => {
    saveToStorage(KEYS.CART, items);
  }, [items]);

  const triggerAnimation = useCallback(() => {
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 500);
  }, []);

  const notifyAddedToCart = useCallback(
    (product, quantity) => {
      if (!product?.id) return;
      setAddedToast({
        product: { ...product },
        quantity: Math.max(1, quantity || 1),
        at: Date.now(),
      });
      triggerAnimation();
    },
    [triggerAnimation],
  );

  const addToCart = useCallback(
    (product, quantity = 1) => {
      const requested = Math.max(1, parseInt(quantity, 10) || 1);
      let trackedQty = requested;
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        const nextQty = existing ? existing.quantity + requested : requested;
        const qty = clampQtyToMin(product, nextQty);
        trackedQty = qty;
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: qty } : i,
          );
        }
        return [...prev, { ...product, quantity: qty }];
      });
      trackAddToCart(product, trackedQty);
      trackMetaAddToCart(product, trackedQty);
      notifyAddedToCart(product, trackedQty);
    },
    [notifyAddedToCart],
  );

  const addUpsellToCart = useCallback(
    (product, quantity = 1, promoOrMeta) => {
      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const meta =
        promoOrMeta && typeof promoOrMeta === 'object'
          ? promoOrMeta
          : { promo: promoOrMeta };
      const lineExtras = {
        upsellPromo: meta.promo || undefined,
        upsellDiscountPercent: meta.upsellDiscountPercent,
        upsellOfferPrice: meta.upsellOfferPrice,
      };
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        const nextQty = existing ? existing.quantity + qty : qty;
        const finalQty = clampQtyToMin({ ...product, ...lineExtras }, nextQty);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id
              ? { ...i, quantity: finalQty, ...lineExtras }
              : i,
          );
        }
        return [...prev, { ...product, quantity: finalQty, ...lineExtras }];
      });
      trackAddToCart(product, qty);
      trackMetaAddToCart(product, qty);
      notifyAddedToCart(product, qty);
    },
    [notifyAddedToCart],
  );

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== productId) return i;
        if (quantity <= 0) return { ...i, quantity: 0 };
        const q = clampQtyToMin(i, parseInt(quantity, 10) || 1);
        return { ...i, quantity: q };
      }).filter((i) => i.quantity > 0),
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

  const totalPrice = useMemo(() => getCartSubtotal(items), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartAnimating,
        addedToast,
        dismissAddedToast,
        addToCart,
        addUpsellToCart,
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
