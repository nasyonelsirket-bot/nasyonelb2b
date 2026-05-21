import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import TrendyolSubNav from './TrendyolSubNav';
import Footer from './Footer';
import WhatsAppFloat from './WhatsAppFloat';
import MetaPixel from '@/components/analytics/MetaPixel';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      <MetaPixel />
      <Header />
      {!isHome && <TrendyolSubNav />}
      <main className="flex-1 w-full min-w-0 pb-20 sm:pb-4">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      {!isHome && <WhatsAppFloat />}
    </div>
  );
}
