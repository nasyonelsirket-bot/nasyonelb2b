import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEMO_PRODUCTS,
  DEMO_CATEGORIES,
  DEMO_BANNERS,
  DEFAULT_SETTINGS,
} from '@/data/demoProducts';
import { loadFromStorage, loadArrayFromStorage, saveToStorage, KEYS } from '@/utils/storage';
import { runBrandMigration, refreshCategoryIcons } from '@/utils/brandMigration';
import { mergePdfSettings } from '@/data/pdfSettingsDefaults';
import { fetchPublishedCatalog, publishCatalog as publishCatalogApi } from '@/services/catalogApi';
import { settingsForPublish, mergePublishedSettings } from '@/utils/catalogPublish';
import {
  buildCategoriesFromProducts,
  getProductCountsByCategory,
  sortCategoriesBySearchPopularity,
} from '@/utils/categories';

const StoreContext = createContext(null);

function loadLocalSettings(migration) {
  if (migration?.settings) return migration.settings;
  const stored = loadFromStorage(KEYS.SETTINGS, null);
  const safe = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const merged = { ...DEFAULT_SETTINGS, ...safe };
  merged.pdfSettings = mergePdfSettings(merged.pdfSettings);
  return merged;
}

export function StoreProvider({ children }) {
  const migration = useMemo(() => runBrandMigration(), []);

  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogSource, setCatalogSource] = useState('local');
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState(null);
  const [publishing, setPublishing] = useState(false);

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
  const [settings, setSettings] = useState(() => loadLocalSettings(migration));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const remote = await fetchPublishedCatalog();
      if (cancelled) return;

      if (remote?.products?.length) {
        setProducts(remote.products);
        setCategories(
          refreshCategoryIcons(
            remote.categories?.length ? remote.categories : buildCategoriesFromProducts(remote.products),
          ),
        );
        if (remote.banners?.length) setBanners(remote.banners);
        setSettings((prev) => mergePublishedSettings(prev, remote.settings));
        setCatalogSource('server');
        setCatalogUpdatedAt(remote.updatedAt || null);
        saveToStorage(KEYS.PRODUCTS, remote.products);
        saveToStorage(KEYS.CATEGORIES, remote.categories || []);
        if (remote.banners?.length) saveToStorage(KEYS.BANNERS, remote.banners);
      } else {
        setCatalogSource('local');
      }

      setCatalogReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => saveToStorage(KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveToStorage(KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => saveToStorage(KEYS.BANNERS, banners), [banners]);
  useEffect(() => saveToStorage(KEYS.SETTINGS, settings), [settings]);

  const productCountsByCategory = useMemo(
    () => getProductCountsByCategory(products),
    [products],
  );

  const sortedCategories = useMemo(
    () => sortCategoriesBySearchPopularity(categories, productCountsByCategory),
    [categories, productCountsByCategory],
  );

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

  const deleteCategories = useCallback((ids) => {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    setCategories((prev) => (Array.isArray(prev) ? prev : []).filter((c) => !idSet.has(c.id)));
  }, []);

  const importTrendyolProducts = useCallback((newProducts) => {
    const safeProducts = Array.isArray(newProducts) ? newProducts : [];
    const syncedCategories = buildCategoriesFromProducts(safeProducts);

    setProducts((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const map = new Map(safePrev.map((p) => [p.sku || p.id, p]));
      safeProducts.forEach((p) => {
        if (p?.sku || p?.id) map.set(p.sku || p.id, p);
      });
      return Array.from(map.values());
    });

    setCategories(refreshCategoryIcons(syncedCategories, { force: true }));
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
    setSettings({ ...DEFAULT_SETTINGS, pdfSettings: mergePdfSettings(DEFAULT_SETTINGS.pdfSettings) });
    setCatalogSource('local');
    try {
      localStorage.setItem('b2b_brand_version', String(4));
    } catch {
      /* ignore */
    }
  }, []);

  const publishCatalog = useCallback(
    async (password) => {
      const list = Array.isArray(products) ? products : [];
      if (!list.length) {
        throw new Error('Yayınlanacak ürün yok. Önce Trendyol veya Excel ile ürün ekleyin.');
      }
      setPublishing(true);
      try {
        const result = await publishCatalogApi({
          products: list,
          categories: Array.isArray(categories) ? categories : [],
          banners: Array.isArray(banners) ? banners : [],
          settings: settingsForPublish(settings),
          password,
        });
        setCatalogSource('server');
        setCatalogUpdatedAt(result.updatedAt || new Date().toISOString());
        return result;
      } finally {
        setPublishing(false);
      }
    },
    [products, categories, banners, settings],
  );

  const refreshAllCategoryEmojis = useCallback(() => {
    setCategories((prev) => refreshCategoryIcons(prev, { force: true }));
  }, []);

  const value = useMemo(
    () => ({
      products,
      categories: sortedCategories,
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
      deleteCategories,
      importTrendyolProducts,
      addBanner,
      updateBanner,
      deleteBanner,
      updateSettings,
      getProductById,
      getProductsByCategory,
      resetToDemo,
      publishCatalog,
      refreshAllCategoryEmojis,
      setProducts,
      setCategories,
      catalogReady,
      catalogSource,
      catalogUpdatedAt,
      publishing,
    }),
    [
      products,
      categories,
      sortedCategories,
      banners,
      settings,
      catalogReady,
      catalogSource,
      catalogUpdatedAt,
      publishing,
      addProduct,
      updateProduct,
      deleteProduct,
      deleteProducts,
      importProducts,
      addCategory,
      updateCategory,
      deleteCategory,
      deleteCategories,
      importTrendyolProducts,
      addBanner,
      updateBanner,
      deleteBanner,
      updateSettings,
      getProductById,
      getProductsByCategory,
      resetToDemo,
      publishCatalog,
      refreshAllCategoryEmojis,
    ],
  );

  if (!catalogReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-brand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" aria-label="Yükleniyor" />
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
