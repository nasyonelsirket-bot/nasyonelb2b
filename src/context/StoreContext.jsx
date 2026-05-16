import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEMO_PRODUCTS,
  DEMO_CATEGORIES,
  DEMO_BANNERS,
  DEFAULT_SETTINGS,
} from '@/data/demoProducts';
import { loadFromStorage, loadArrayFromStorage, saveToStorage, KEYS } from '@/utils/storage';
import { runBrandMigration, refreshCategoryIcons } from '@/utils/brandMigration';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const migration = useMemo(() => runBrandMigration(), []);

  const [products, setProducts] = useState(() =>
    loadArrayFromStorage(KEYS.PRODUCTS, DEMO_PRODUCTS),
  );
  const [categories, setCategories] = useState(() => {
    if (migration?.categories?.length) return migration.categories;
    const stored = loadArrayFromStorage(KEYS.CATEGORIES, DEMO_CATEGORIES);
    return refreshCategoryIcons(stored);
  });
  const [banners, setBanners] = useState(() =>
    loadArrayFromStorage(KEYS.BANNERS, DEMO_BANNERS),
  );
  const [settings, setSettings] = useState(() => {
    if (migration?.settings) return migration.settings;
    const stored = loadFromStorage(KEYS.SETTINGS, null);
    const safe =
      stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    return { ...DEFAULT_SETTINGS, ...safe };
  });

  useEffect(() => saveToStorage(KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveToStorage(KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => saveToStorage(KEYS.BANNERS, banners), [banners]);
  useEffect(() => saveToStorage(KEYS.SETTINGS, settings), [settings]);

  const addProduct = useCallback((product) => {
    setProducts((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { ...product, id: product.id || `p-${Date.now()}` },
    ]);
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) =>
      (Array.isArray(prev) ? prev : []).map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  }, []);

  const deleteProduct = useCallback((id) => {
    if (!id) return;
    setProducts((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== id) : []));
  }, []);

  const deleteProducts = useCallback((ids) => {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    setProducts((prev) =>
      (Array.isArray(prev) ? prev : []).filter((p) => !idSet.has(p.id)),
    );
  }, []);

  const importProducts = useCallback((newProducts, newCategories) => {
    setProducts((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const map = new Map(safePrev.map((p) => [p.sku || p.id, p]));
      newProducts.forEach((p) => {
        if (p?.sku || p?.id) map.set(p.sku || p.id, p);
      });
      return Array.from(map.values());
    });
    if (newCategories?.length) {
      setCategories((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const names = new Set(safePrev.map((c) => c.name));
        const merged = [...safePrev];
        newCategories.forEach((c) => {
          if (!names.has(c.name)) merged.push(c);
        });
        return merged;
      });
    }
  }, []);

  const addCategory = useCallback((cat) => {
    setCategories((prev) => [...prev, { ...cat, id: cat.id || `cat-${Date.now()}` }]);
  }, []);

  const updateCategory = useCallback((id, updates) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addBanner = useCallback((banner) => {
    setBanners((prev) => [...prev, { ...banner, id: banner.id || `banner-${Date.now()}` }]);
  }, []);

  const updateBanner = useCallback((id, updates) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBanner = useCallback((id) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const getProductById = useCallback(
    (id) => (Array.isArray(products) ? products : []).find((p) => p.id === id),
    [products],
  );

  const getProductsByCategory = useCallback(
    (categoryName) =>
      (Array.isArray(products) ? products : []).filter((p) => p.category === categoryName),
    [products],
  );

  const resetToDemo = useCallback(() => {
    setProducts(DEMO_PRODUCTS);
    setCategories(refreshCategoryIcons(DEMO_CATEGORIES));
    setBanners(DEMO_BANNERS);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('b2b_brand_version', String(3));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAllCategoryEmojis = useCallback(() => {
    setCategories((prev) => refreshCategoryIcons(prev, { force: true }));
  }, []);

  const value = useMemo(
    () => ({
      products,
      categories,
      banners,
      settings,
      addProduct,
      updateProduct,
      deleteProduct,
      deleteProducts,
      importProducts,
      addCategory,
      updateCategory,
      deleteCategory,
      addBanner,
      updateBanner,
      deleteBanner,
      updateSettings,
      getProductById,
      getProductsByCategory,
      resetToDemo,
      refreshAllCategoryEmojis,
      setProducts,
      setCategories,
    }),
    [
      products,
      categories,
      banners,
      settings,
      addProduct,
      updateProduct,
      deleteProduct,
      deleteProducts,
      importProducts,
      addCategory,
      updateCategory,
      deleteCategory,
      addBanner,
      updateBanner,
      deleteBanner,
      updateSettings,
      getProductById,
      getProductsByCategory,
      resetToDemo,
      refreshAllCategoryEmojis,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
