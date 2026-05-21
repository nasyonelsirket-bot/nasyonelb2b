import { lazy, Suspense } from 'react';
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

import HomePage from '@/pages/HomePage';
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const BestSellersPage = lazy(() => import('@/pages/BestSellersPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const AccountOverviewPage = lazy(() => import('@/pages/account/AccountOverviewPage'));
const AccountOrdersPage = lazy(() => import('@/pages/account/AccountOrdersPage'));
const AccountAddressesPage = lazy(() => import('@/pages/account/AccountAddressesPage'));
const AccountProfilePage = lazy(() => import('@/pages/account/AccountProfilePage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));

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
      <ErrorBoundary>
      <StoreProvider>
        <CartProvider>
          <MemberProvider>
          <BrowserRouter>
            <Ga4Bootstrap />
            <Ga4PageTracker />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="kategoriler" element={<Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense>} />
                <Route path="urun/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
                <Route path="sepet" element={<Suspense fallback={<PageLoader />}><CartPage /></Suspense>} />
                <Route path="hakkimizda" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
                <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
                <Route path="en-cok-satanlar" element={<Suspense fallback={<PageLoader />}><BestSellersPage /></Suspense>} />
                <Route path="giris" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
                <Route path="kayit" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
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
