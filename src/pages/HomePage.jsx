import { useMemo, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import HeroBanner from '@/components/home/HeroBanner';
import ProductGrid from '@/components/home/ProductGrid';
import ProductStrip from '@/components/home/ProductStrip';
import HomeCartDrawer from '@/components/home/HomeCartDrawer';
import TrustBadges from '@/components/home/TrustBadges';

const HomeTrustSection = lazy(() => import('@/components/home/HomeTrustSection'));
const RecentlyViewedStrip = lazy(() => import('@/components/home/RecentlyViewedStrip'));
const HomeSocialProof = lazy(() => import('@/components/home/HomeSocialProof'));
import { useStore } from '@/context/StoreContext';
import { hasTrendyolSalesData } from '@/utils/productBestseller';
import {
  resolveHomepageSection,
  normalizeHomepageLayout,
  countPinnedInSection,
  getSectionHashId,
  isBannerSectionId,
} from '@/utils/homepagePlacements';

const HASH_SECTIONS = ['urunler', 'cok-satanlar', 'yeni-gelenler', 'firsatlar', 'egitici', 'sepet'];
const HOME_ALL_PRODUCTS_PREVIEW = 21;

function defaultBestsellerSubtitle(layout, catalog) {
  const pinned = countPinnedInSection(layout, 'bestsellers');
  const hasOrderSales = hasTrendyolSalesData(catalog);
  if (layout.sections.bestsellers?.subtitle) return layout.sections.bestsellers.subtitle;
  if (pinned > 0) {
    return `Editör seçimi + ${hasOrderSales ? 'Trendyol satış sıralaması' : 'popüler ürünler'}`;
  }
  if (hasOrderSales) {
    return 'Son 15 günde en çok tercih edilen ürünler (iptal/iade hariç)';
  }
  return 'Müşterilerimizin en çok tercih ettiği ürünler';
}

export default function HomePage() {
  const { products, settings } = useStore();
  const homepageLayout = useMemo(() => normalizeHomepageLayout(settings), [settings]);
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const q = params.get('q')?.toLowerCase();

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const catalog = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  const filtered = useMemo(() => {
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [catalog, q]);

  const sectionProducts = useMemo(() => {
    const out = {};
    for (const id of ['bestsellers', 'newArrivals', 'deals', 'educational']) {
      out[id] = resolveHomepageSection(catalog, settings, id);
    }
    return out;
  }, [catalog, settings]);

  useEffect(() => {
    const id = hash.replace('#', '');
    if (!HASH_SECTIONS.includes(id)) return;
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
    if (id === 'sepet') setCartOpen(true);
  }, [hash, filtered.length]);

  const renderStrip = (sectionId) => {
    const cfg = homepageLayout.sections[sectionId];
    if (!cfg?.enabled) return null;
    const list = sectionProducts[sectionId];
    if (!list?.length) return null;

    const hashId = getSectionHashId(sectionId);
    let subtitle = cfg.subtitle;
    if (sectionId === 'bestsellers' && !subtitle) {
      subtitle = defaultBestsellerSubtitle(homepageLayout, catalog);
    }
    if (sectionId === 'allProducts' && !subtitle && !q) {
      subtitle = `${filtered.length} ürün — sıralamayı değiştirin`;
    }

    return (
      <div key={sectionId} id={hashId} className="scroll-mt-32">
        <ProductStrip
          products={list}
          title={cfg.title}
          subtitle={subtitle}
          badge={cfg.badge || undefined}
          seeAllHref={cfg.seeAllHref}
          seeAllLabel={cfg.seeAllLabel}
          accent={cfg.accent}
        />
      </div>
    );
  };

  const renderAllProducts = () => {
    const cfg = homepageLayout.sections.allProducts;
    if (!cfg?.enabled) return null;

    const title = q ? `Arama: "${q}"` : cfg.title || 'Tüm Ürünler';
    let subtitle = q ? `${filtered.length} ürün` : cfg.subtitle;
    if (!subtitle && !q) {
      subtitle =
        filtered.length > HOME_ALL_PRODUCTS_PREVIEW
          ? `${HOME_ALL_PRODUCTS_PREVIEW} ürün gösteriliyor — toplam ${filtered.length} ürün`
          : `${filtered.length} ürün — sıralamayı değiştirin`;
    }

    return (
      <div key="allProducts" id={getSectionHashId('allProducts')} className="scroll-mt-32 bg-white">
        <ProductGrid
          products={filtered}
          title={title}
          subtitle={subtitle}
          showSort={cfg.showSort !== false}
          previewLimit={!q ? HOME_ALL_PRODUCTS_PREVIEW : undefined}
          seeAllHref={!q && filtered.length > HOME_ALL_PRODUCTS_PREVIEW ? '/kategoriler?hepsi=1' : undefined}
          seeAllLabel="Tümünü Gör"
        />
      </div>
    );
  };

  const renderBanner = (sectionId) => {
    const cfg = homepageLayout.sections[sectionId];
    if (!cfg || cfg.enabled === false) return null;
    return (
      <div key={sectionId} id={sectionId} className="scroll-mt-32">
        <HeroBanner bannerIds={cfg.bannerIds} />
      </div>
    );
  };

  const renderTrust = () => {
    const cfg = homepageLayout.sections.trust;
    if (cfg?.enabled === false) return null;
    return (
      <div key="trust" id="guven" className="scroll-mt-32">
        <Suspense fallback={null}>
          <HomeTrustSection />
        </Suspense>
      </div>
    );
  };

  return (
    <div className="pb-8 bg-gray-50">
      <SEO
        title="Ana Sayfa"
        description="Nasyonel Toys — eğitici oyuncaklar, çok satanlar, güvenli PayTR ödeme ve hızlı kargo. Türkiye geneli gönderim."
        path="/"
      />

      <h1 className="sr-only">Nasyonel Toys — Online Oyuncak Mağazası</h1>

      {!q && <TrustBadges />}

      {!q &&
        homepageLayout.order.map((sectionId) => {
          if (isBannerSectionId(sectionId)) return renderBanner(sectionId);
          if (sectionId === 'trust') return renderTrust();
          if (sectionId === 'allProducts') {
            return (
              <div key="all-products-block">
                {renderAllProducts()}
                <Suspense fallback={null}>
                  <RecentlyViewedStrip />
                  <HomeSocialProof />
                </Suspense>
              </div>
            );
          }
          return renderStrip(sectionId);
        })}

      {q && (
        <>
          {renderAllProducts()}
          <Suspense fallback={null}>
            <RecentlyViewedStrip />
          </Suspense>
        </>
      )}

      <HomeCartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
