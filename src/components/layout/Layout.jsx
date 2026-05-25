import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import CartAddedToast from '@/components/cart/CartAddedToast';
import MetaPixel from '@/components/analytics/MetaPixel';
import ErrorBoundary from '@/components/ErrorBoundary';

function isCheckoutPath(pathname) {
  return /^\/(sepet|odeme)/.test(pathname);
}

export default function Layout() {
  const { pathname } = useLocation();
  const checkout = isCheckoutPath(pathname);

  useEffect(() => {
    const html = document.documentElement;
    const apply = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      if (checkout && mobile) {
        html.classList.add('checkout-active');
      } else {
        html.classList.remove('checkout-active');
      }
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      html.classList.remove('checkout-active');
      window.removeEventListener('resize', apply);
    };
  }, [checkout]);

  return (
    <div className={`flex min-h-screen flex-col ${checkout ? 'layout-checkout' : ''}`}>
      <a href="#main-content" className="sr-only skip-link focus-ring">
        İçeriğe atla
      </a>
      <MetaPixel />
      <Header />
      <CartAddedToast />
      <main
        id="main-content"
        className={`checkout-main flex-1 w-full min-w-0 ${
          checkout ? '' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-4'
        }`}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
