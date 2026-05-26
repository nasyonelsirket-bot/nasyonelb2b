import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import { MemberProvider } from '@/context/MemberContext';
import AccountGuard from '@/components/account/AccountGuard';
import AccountLayout from '@/components/account/AccountLayout';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import Ga4Bootstrap from '@/components/analytics/Ga4Bootstrap';
import Ga4PageTracker from '@/components/analytics/Ga4PageTracker';
import GlobalSiteHead from '@/components/seo/GlobalSiteHead';
import MemberActivityTracker from '@/components/account/MemberActivityTracker';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

import { MAIN_CATEGORIES } from '@/data/mainCategories';

/* Checkout kritik yolu — lazy chunk hatası riskini azaltmak için doğrudan yükle */
import CartPage from '@/pages/CartPage';
import PaymentPage from '@/pages/PaymentPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentFailPage from '@/pages/PaymentFailPage';

const HomePage = lazyWithRetry(() => import('@/pages/HomePage'));
const CategoriesPage = lazyWithRetry(() => import('@/pages/CategoriesPage'));
const CategoryLandingPage = lazyWithRetry(() => import('@/pages/CategoryLandingPage'));
const ProductDetailPage = lazyWithRetry(() => import('@/pages/ProductDetailPage'));
const AboutPage = lazyWithRetry(() => import('@/pages/AboutPage'));
const ContactPage = lazyWithRetry(() => import('@/pages/ContactPage'));
const BestSellersPage = lazyWithRetry(() => import('@/pages/BestSellersPage'));
const LegalPage = lazyWithRetry(() => import('@/pages/LegalPage'));
const LoginPage = lazyWithRetry(() => import('@/pages/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('@/pages/RegisterPage'));
const OrderTrackPage = lazyWithRetry(() => import('@/pages/OrderTrackPage'));
const FaqPage = lazyWithRetry(() => import('@/pages/FaqPage'));
const AccountOverviewPage = lazyWithRetry(() => import('@/pages/account/AccountOverviewPage'));
const AccountOrdersPage = lazyWithRetry(() => import('@/pages/account/AccountOrdersPage'));
const AccountAddressesPage = lazyWithRetry(() => import('@/pages/account/AccountAddressesPage'));
const AccountProfilePage = lazyWithRetry(() => import('@/pages/account/AccountProfilePage'));
const AdminPage = lazyWithRetry(() => import('@/pages/AdminPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <GlobalSiteHead />
      <ErrorBoundary>
      <StoreProvider>
        <CartProvider>
          <MemberProvider>
          <BrowserRouter>
            <MemberActivityTracker />
            <Ga4Bootstrap />
            <Ga4PageTracker />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
                <Route path="kategoriler" element={<Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense>} />
                {MAIN_CATEGORIES.map((c) => (
                  <Route
                    key={c.slug}
                    path={c.slug}
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <CategoryLandingPage />
                      </Suspense>
                    }
                  />
                ))}
                <Route path="urun/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
                <Route path="sepet" element={<CartPage />} />
                <Route path="odeme" element={<PaymentPage />} />
                <Route path="odeme/basarili" element={<PaymentSuccessPage />} />
                <Route path="odeme/basarisiz" element={<PaymentFailPage />} />
                <Route path="odeme/hata" element={<PaymentFailPage />} />
                <Route path="hakkimizda" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
                <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
                <Route path="en-cok-satanlar" element={<Suspense fallback={<PageLoader />}><BestSellersPage /></Suspense>} />
                <Route path="giris" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
                <Route path="kayit" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
                <Route path="siparis-takip" element={<Suspense fallback={<PageLoader />}><OrderTrackPage /></Suspense>} />
                <Route path="sss" element={<Suspense fallback={<PageLoader />}><FaqPage /></Suspense>} />
                <Route
                  path="hesabim"
                  element={
                    <AccountGuard>
                      <AccountLayout />
                    </AccountGuard>
                  }
                >
                  <Route
                    index
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AccountOverviewPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="siparislerim"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AccountOrdersPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="adreslerim"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AccountAddressesPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="profilim"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AccountProfilePage />
                      </Suspense>
                    }
                  />
                </Route>
                <Route path="sozlesme/:slug" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
              </Route>
              <Route path="admin" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><AdminPage /></ErrorBoundary></Suspense>} />
            </Routes>
          </BrowserRouter>
          </MemberProvider>
        </CartProvider>
      </StoreProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
