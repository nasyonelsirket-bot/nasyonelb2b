import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import InstagramIcon from '@/components/ui/InstagramIcon';
import {
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  FACEBOOK_URL,
  TIKTOK_URL,
  LEGAL_ROUTES,
} from '@/constants/siteLinks';
import { useStore } from '@/context/StoreContext';
import { useMember } from '@/context/MemberContext';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';
import { APP_VERSION } from '@/constants/appVersion';
import FooterFaqAccordion from '@/components/layout/FooterFaqAccordion';

export default function Footer() {
  const { settings } = useStore();
  const { isLoggedIn } = useMember();
  const siteName = settings.siteName || 'Nasyonel Toys';

  return (
    <footer className="gradient-hero text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={resolveLogoUrl(settings.logoUrl)}
              alt={siteName}
              className="site-logo-footer mb-4"
            />
            <p className="text-brand-100 text-sm leading-relaxed">
              Eğitici ve eğlenceli oyuncaklar — güvenli alışveriş, hızlı kargo ve kolay iade ile
              ailelere güvenilir bir alışveriş deneyimi sunuyoruz.
            </p>
            <p className="mt-3 text-xs text-accent-gold font-medium">
              14 iş günü içinde iade hakkı · 750 TL üzeri kargo bedava
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-accent-gold">Kategoriler</h4>
            <ul className="space-y-2 text-sm text-brand-100">
              <li>
                <Link to="/" className="hover:text-white">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link to="/en-cok-satanlar" className="hover:text-white">
                  En Çok Satanlar
                </Link>
              </li>
              <li>
                <Link to="/#urunler" className="hover:text-white">
                  Tüm Ürünler
                </Link>
              </li>
              <li>
                <Link to="/kategoriler" className="hover:text-white">
                  Kategorilere Göz At
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-accent-gold">Hesabım</h4>
            <ul className="space-y-2 text-sm text-brand-100">
              <li>
                <Link to={isLoggedIn ? '/hesabim' : '/giris'} className="hover:text-white">
                  {isLoggedIn ? 'Hesabım' : 'Giriş Yap'}
                </Link>
              </li>
              <li>
                <Link to="/kayit" className="hover:text-white">
                  Kayıt Ol
                </Link>
              </li>
              <li>
                <Link to="/siparis-takip" className="hover:text-white">
                  Sipariş Takip
                </Link>
              </li>
              <li>
                <Link to="/sepet" className="hover:text-white">
                  Sepetim
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-accent-gold">Sözleşmeler & Yardım</h4>
            <ul className="space-y-2 text-sm text-brand-100">
              {LEGAL_ROUTES.map((r) => (
                <li key={r.path}>
                  <Link to={r.path} className="hover:text-white">
                    {r.label}
                  </Link>
                </li>
              ))}
              <FooterFaqAccordion />
            </ul>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-brand-700/50 pt-8">
          <ul className="space-y-3 text-sm text-brand-100">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-accent-gold" />
              {settings.contactPhone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-accent-gold" />
              {settings.contactEmail}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-accent-gold" />
              {settings.contactAddress}
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              <InstagramIcon className="h-5 w-5" />@{INSTAGRAM_HANDLE}
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Facebook
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              TikTok
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-brand-200 space-y-1">
          <p className="font-semibold text-white">nasyoneltoys — tüm hakları saklıdır.</p>
          <p>© {new Date().getFullYear()} {siteName}</p>
          <p className="text-xs text-brand-400">Sürüm: {APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
