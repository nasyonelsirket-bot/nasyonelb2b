import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_SETTINGS } from '@/data/demoProducts';
import { APP_VERSION } from '@/constants/appVersion';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';

function footerAboutText(settings) {
  const raw = String(settings?.aboutText || '').trim();
  const fallback = DEFAULT_SETTINGS.aboutText;
  let text = raw;
  if (!text || /toywholesale/i.test(text)) {
    text = fallback;
  }
  if (text.length <= 200) return text;
  return `${text.slice(0, 197).replace(/\s+\S*$/, '')}…`;
}

export default function Footer() {
  const { settings } = useStore();
  const siteName = settings.siteName || 'Nasyonel Toys';

  return (
    <footer className="gradient-hero text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <img
              src={resolveLogoUrl(settings.logoUrl)}
              alt={siteName}
              className="site-logo-footer mb-4"
            />
            <p className="text-brand-200 text-sm max-w-md leading-relaxed">
              {footerAboutText(settings)}
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Hızlı Linkler</h4>
            <ul className="space-y-2 text-sm text-brand-200">
              <li><Link to="/kategoriler" className="hover:text-white">Kategoriler</Link></li>
              <li><Link to="/hakkimizda" className="hover:text-white">Hakkımızda</Link></li>
              <li><Link to="/sepet" className="hover:text-white">Sepetim</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">İletişim</h4>
            <ul className="space-y-3 text-sm text-brand-200">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                {settings.contactPhone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                {settings.contactEmail}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {settings.contactAddress}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-brand-700/50 pt-6 text-center text-sm text-brand-300 space-y-1">
          <p>© {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.</p>
          <p className="text-xs text-brand-400">Site sürümü: {APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
