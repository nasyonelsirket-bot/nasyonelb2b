import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import CartAddedToast from '@/components/cart/CartAddedToast';
import MetaPixel from '@/components/analytics/MetaPixel';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <MetaPixel />
      <Header />
      <CartAddedToast />
      <main className="flex-1 w-full min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-4">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
