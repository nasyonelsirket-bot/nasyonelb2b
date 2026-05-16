import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';

const HomePage = lazy(() => import('@/pages/HomePage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
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
      <StoreProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <HomePage />
                    </Suspense>
                  }
                />
                <Route path="kategoriler" element={<Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense>} />
                <Route path="urun/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
                <Route path="sepet" element={<Suspense fallback={<PageLoader />}><CartPage /></Suspense>} />
                <Route path="hakkimizda" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
                <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
              </Route>
              <Route path="admin" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><AdminPage /></ErrorBoundary></Suspense>} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </StoreProvider>
    </HelmetProvider>
  );
}
