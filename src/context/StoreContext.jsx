import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEMO_PRODUCTS,
  DEMO_CATEGORIES,
  DEMO_BANNERS,
  DEFAULT_SETTINGS,
} from '@/data/demoProducts';
import {
  loadFromStorage,
  loadArrayFromStorage,
  loadProductsCache,
  saveToStorage,
  saveCatalogMeta,
  KEYS,
} from '@/utils/storage';
import { runBrandMigration, refreshCategoryIcons } from '@/utils/brandMigration';
import { mergePdfSettings } from '@/data/pdfSettingsDefaults';
import { fetchPublishedCatalog, publishCatalog as publishCatalogApi } from '@/services/catalogApi';
import { settingsForPublish, mergePublishedSettings } from '@/utils/catalogPublish';
import {
  buildCategoriesFromProducts,
  getProductCountsByCategory,
  sortCategoriesBySearchPopularity,
} from '@/utils/categories';
import { migrateProductsSeo, normalizeProductSeoFields } from '@/utils/productSeo';
import { migrateProductsReviews } from '@/utils/productReviews';
import { migrateLegacyProductPrices } from '@/utils/legacyPriceMigration';
import { pruneBannerIdFromLayout } from '@/utils/bannerCatalog';
import {
  clearBannerCaches,
  loadBannersFromStorage,
  logBannerState,
  persistBannersToStorage,
} from '@/utils/bannerStorage';

function migrateCatalog(products) {
  const seo = migrateProductsSeo(products);
  const reviewed = migrateProductsReviews(seo);
  return migrateLegacyProductPrices(reviewed).products;
}

const StoreContext = createContext(null);

function isAdminSession() {
  try {
    return sessionStorage.getItem('b2b_admin') === '1';
  } catch {
    return false;
  }
}

function loadLocalSettings(migration) {
  if (migration?.settings) return migration.settings;
  const stored = loadFromStorage(KEYS.SETTINGS, null);
  const safe = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const merged = { ...DEFAULT_SETTINGS, ...safe };
  merged.pdfSettings = mergePdfSettings(merged.pdfSettings);
  return merged;
}

function persistPublishedCatalog(remote) {
  if (!remote?.products?.length) return;
  saveToStorage(KEYS.PRODUCTS, remote.products);
  if (Array.isArray(remote.categories)) saveToStorage(KEYS.CATEGORIES, remote.categories);
  if (Array.isArray(remote.banners)) {
    persistBannersToStorage(remote.banners);
  }
}

function hydrateInitialCatalog(migration) {
  const meta = loadFromStorage(KEYS.CATALOG_META, null);
  const cachedProducts = loadProductsCache();
  if (meta?.updatedAt && cachedProducts.length) {
    const cachedCategories = loadArrayFromStorage(KEYS.CATEGORIES, []);
    const cachedBanners = loadBannersFromStorage();
    return {
      products: migrateCatalog(cachedProducts),
      categories: refreshCategoryIcons(
        cachedCategories.length ? cachedCategories : buildCategoriesFromProducts(cachedProducts),
      ),
      banners: cachedBanners,
      source: 'cache',
      updatedAt: meta.updatedAt,
    };
  }

  if (isAdminSession()) {
    const localProducts = loadArrayFromStorage(KEYS.PRODUCTS, []);
    if (localProducts.length) {
      const localCategories = loadArrayFromStorage(KEYS.CATEGORIES, []);
      const localBanners = loadBannersFromStorage();
      return {
        products: migrateCatalog(localProducts),
        categories: refreshCategoryIcons(
          localCategories.length ? localCategories : buildCategoriesFromProducts(localProducts),
        ),
        banners: localBanners,
        source: 'local',
        updatedAt: null,
      };
    }
  }

  return {
    products: migrateCatalog(DEMO_PRODUCTS),
    categories: refreshCategoryIcons(
      migration?.categories?.length ? migration.categories : DEMO_CATEGORIES,
    ),
    banners: [...DEMO_BANNERS],
    source: 'local',
    updatedAt: null,
  };
}

export function StoreProvider({ children }) {
  const migration = useMemo(() => runBrandMigration(), []);
  const initialCatalog = useMemo(() => hydrateInitialCatalog(migration), [migration]);

  const [catalogReady, setCatalogReady] = useState(true);
  const [catalogLoadError, setCatalogLoadError] = useState(null);
  const [products, setProducts] = useState(() => initialCatalog.products);
  const [categories, setCategories] = useState(() => initialCatalog.categories);
  const [banners, setBanners] = useState(() => initialCatalog.banners);
  const [settings, setSettings] = useState(() => loadLocalSettings(migration));
  const [catalogSource, setCatalogSource] = useState(initialCatalog.source);
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState(initialCatalog.updatedAt);

  const [publishing, setPublishing] = useState(false);
  const [bannerRevision, setBannerRevision] = useState(() => Date.now());

  const applyRemoteCatalog = useCallback((remote) => {
    if (!remote?.products?.length) return false;
    setProducts(migrateCatalog(remote.products));
    setCategories(
      refreshCategoryIcons(
        remote.categories?.length ? remote.categories : buildCategoriesFromProducts(remote.products),
      ),
    );
    if (remote.banners?.length) setBanners(remote.banners);
    setSettings((prev) => mergePublishedSettings(prev, remote.settings));
    setCatalogSource('server');
    const updatedAt = remote.updatedAt || new Date().toISOString();
    setCatalogUpdatedAt(updatedAt);
    persistPublishedCatalog(remote);
    saveCatalogMeta({
      updatedAt,
      productCount: remote.products.length,
    });
    return true;
  }, []);

  const applyCachedCatalog = useCallback(() => {
    const meta = loadFromStorage(KEYS.CATALOG_META, null);
    const cachedProducts = loadProductsCache();
    if (!meta?.updatedAt || !cachedProducts.length) return false;
    setProducts(migrateCatalog(cachedProducts));
    const cachedCategories = loadArrayFromStorage(KEYS.CATEGORIES, []);
    setCategories(
      refreshCategoryIcons(
        cachedCategories.length ? cachedCategories : buildCategoriesFromProducts(cachedProducts),
      ),
    );
    const cachedBanners = loadBannersFromStorage();
    setBanners(cachedBanners);
    setBannerRevision(Date.now());
    setCatalogSource('cache');
    setCatalogUpdatedAt(meta.updatedAt);
    return true;
  }, []);

  const applyLocalAdminCatalog = useCallback(() => {
    if (!isAdminSession()) return false;
    const localProducts = loadArrayFromStorage(KEYS.PRODUCTS, []);
    if (!localProducts.length) return false;
    setProducts(migrateCatalog(localProducts));
    const localCategories = loadArrayFromStorage(KEYS.CATEGORIES, []);
    setCategories(
      refreshCategoryIcons(
        localCategories.length ? localCategories : buildCategoriesFromProducts(localProducts),
      ),
    );
    const localBanners = loadBannersFromStorage();
    setBanners(localBanners);
    setBannerRevision(Date.now());
    setCatalogSource('local');
    return true;
  }, []);

  const loadPublishedCatalog = useCallback(async () => {
    setCatalogLoadError(null);
    try {
      const remote = await fetchPublishedCatalog();
      if (applyRemoteCatalog(remote)) return;
      if (applyCachedCatalog()) return;
      if (applyLocalAdminCatalog()) return;
      setProducts(migrateCatalog(DEMO_PRODUCTS));
      setCategories(refreshCategoryIcons(DEMO_CATEGORIES));
      setBanners([...DEMO_BANNERS]);
      setBannerRevision(Date.now());
      setCatalogSource('local');
    } catch (err) {
      console.error('Katalog yüklenemedi:', err);
      setCatalogLoadError(err?.message || 'Katalog yüklenemedi');
      if (applyCachedCatalog()) return;
      if (applyLocalAdminCatalog()) return;
      setProducts(migrateCatalog(DEMO_PRODUCTS));
      setCategories(refreshCategoryIcons(DEMO_CATEGORIES));
    }
  }, [applyRemoteCatalog, applyCachedCatalog, applyLocalAdminCatalog]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadPublishedCatalog();
      } catch {
        /* hydrateInitialCatalog already rendered usable catalog */
      } finally {
        if (!cancelled) setCatalogReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadPublishedCatalog]);

  useEffect(() => {
    if (!catalogReady) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadPublishedCatalog();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadPublishedCatalog, catalogReady]);

  useEffect(() => {
    if (!catalogReady || !isAdminSession()) return;
    saveToStorage(KEYS.PRODUCTS, products);
  }, [products, catalogReady]);
  useEffect(() => {
    if (!catalogReady || !isAdminSession()) return;
    saveToStorage(KEYS.CATEGORIES, categories);
  }, [categories, catalogReady]);
  useEffect(() => {
    if (!catalogReady || !isAdminSession()) return;
    persistBannersToStorage(banners);
  }, [banners, catalogReady]);
  useEffect(() => {
    saveToStorage(KEYS.SETTINGS, settings);
  }, [settings]);

  const productCountsByCategory = useMemo(
    () => getProductCountsByCategory(products),
    [products],
  );

  const sortedCategories = useMemo(
    () => sortCategoriesBySearchPopularity(categories, productCountsByCategory),
    [categories, productCountsByCategory],
  );

  const addProduct = useCallback((product) => {
    setProducts((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const normalized = normalizeProductSeoFields(product, list);
      return [...list, { ...normalized, id: normalized.id || `p-${Date.now()}` }];
    });
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((p) => {
        if (p.id !== id) return p;
        return normalizeProductSeoFields({ ...p, ...updates }, list, id);
      });
    });
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
      return migrateCatalog(Array.from(map.values()));
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
      return migrateCatalog(Array.from(map.values()));
    });

    setCategories(refreshCategoryIcons(syncedCategories, { force: true }));
  }, []);

  const bumpBannerRevision = useCallback(() => {
    setBannerRevision(Date.now());
  }, []);

  const addBanner = useCallback((banner) => {
    const next = {
      ...banner,
      id: banner.id || `bnr-${Date.now()}`,
      updatedAt: Date.now(),
      active: banner.active !== false,
    };
    setBanners((prev) => {
      const list = [...prev, next];
      persistBannersToStorage(list);
      logBannerState('add', list, settings);
      return list;
    });
    bumpBannerRevision();
  }, [settings, bumpBannerRevision]);

  const updateBanner = useCallback((id, updates) => {
    setBanners((prev) => {
      const list = prev.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b,
      );
      persistBannersToStorage(list);
      logBannerState('update', list, settings);
      return list;
    });
    bumpBannerRevision();
  }, [settings, bumpBannerRevision]);

  const deleteBanner = useCallback((id) => {
    if (!id) return;
    let nextSettings = settings;
    setSettings((prev) => {
      const layoutPatch = pruneBannerIdFromLayout(prev, id);
      nextSettings = layoutPatch ? { ...prev, ...layoutPatch } : prev;
      return nextSettings;
    });
    setBanners((prev) => {
      const list = prev.filter((b) => b.id !== id);
      clearBannerCaches(list);
      logBannerState('delete', list, nextSettings);
      return list;
    });
    bumpBannerRevision();
  }, [settings, bumpBannerRevision]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.homepageLayout) {
        bumpBannerRevision();
        logBannerState('layout', banners, next);
      }
      return next;
    });
  }, [banners, bumpBannerRevision]);

  const getProductById = useCallback(
    (id) => (Array.isArray(products) ? products : []).find((p) => p.id === id),
    [products],
  );

  const getProductByIdOrSlug = useCallback(
    (param) => {
      const list = Array.isArray(products) ? products : [];
      if (!param) return undefined;
      return list.find((p) => p.id === param) || list.find((p) => p.slug === param);
    },
    [products],
  );

  const getProductsByCategory = useCallback(
    (categoryName) =>
      (Array.isArray(products) ? products : []).filter((p) => p.category === categoryName),
    [products],
  );

  const resetToDemo = useCallback(() => {
    setProducts(migrateCatalog(DEMO_PRODUCTS));
    setCategories(refreshCategoryIcons(DEMO_CATEGORIES));
    setBanners([...DEMO_BANNERS]);
    clearBannerCaches([]);
    setBannerRevision(Date.now());
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
        const updatedAt = result.updatedAt || new Date().toISOString();
        setCatalogSource('server');
        setCatalogUpdatedAt(updatedAt);
        persistBannersToStorage(Array.isArray(banners) ? banners : []);
        setBannerRevision(Date.now());
        logBannerState('publish', banners, settings);
        saveCatalogMeta({
          updatedAt,
          productCount: list.length,
        });
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
      bannerRevision,
      settings,
      bumpBannerRevision,
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
      getProductByIdOrSlug,
      getProductsByCategory,
      resetToDemo,
      publishCatalog,
      refreshAllCategoryEmojis,
      setProducts,
      setCategories,
      catalogReady,
      catalogLoadError,
      catalogSource,
      catalogUpdatedAt,
      publishing,
      loadPublishedCatalog,
    }),
    [
      products,
      categories,
      sortedCategories,
      banners,
      bannerRevision,
      settings,
      bumpBannerRevision,
      catalogReady,
      catalogLoadError,
      catalogSource,
      catalogUpdatedAt,
      publishing,
      loadPublishedCatalog,
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
      getProductByIdOrSlug,
      getProductsByCategory,
      resetToDemo,
      publishCatalog,
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
