import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Shield,
} from 'lucide-react';
import InstagramIcon from '@/components/ui/InstagramIcon';
import BrandLogo from '@/components/brand/BrandLogo';
import { APP_VERSION } from '@/constants/appVersion';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import {
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  FACEBOOK_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
  LEGAL_ROUTES,
  FOOTER_PRIMARY_LEGAL,
} from '@/constants/siteLinks';
import {
  BUSINESS_HOURS,
  COMPANY_ADDRESS,
  PAYTR_TRUST_LABEL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '@/constants/companyInfo';
import { useStore } from '@/context/StoreContext';
import { useMember } from '@/context/MemberContext';

function whatsAppHref(number) {
  const phone = String(number || '').replace(/\D/g, '');
  return phone ? `https://wa.me/${phone}` : null;
}

export default function Footer() {
  const { settings } = useStore();
  const { isLoggedIn } = useMember();
  const siteName = settings.siteName || 'Nasyonel Toys';
  const phone = settings.contactPhone || SUPPORT_PHONE;
  const email = settings.contactEmail || SUPPORT_EMAIL;
  const address = settings.contactAddress || COMPANY_ADDRESS;
  const waLink = whatsAppHref(settings.whatsappNumber);

  const secondaryLegal = LEGAL_ROUTES.filter(
    (r) => !FOOTER_PRIMARY_LEGAL.some((p) => p.path === r.path),
  );

  return (
    <footer className="gradient-hero text-white mt-auto">
      <div className="border-b border-brand-700/40 bg-brand-950/30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
          <p className="text-center text-xs sm:text-sm text-brand-200">{PAYTR_TRUST_LABEL}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandLogo logoUrl={settings.logoUrl} siteName={siteName} variant="footer" className="mb-4" />
            <p className="text-brand-100 text-sm leading-relaxed">
              Eğitici ve eğlenceli oyuncaklar — güvenli kart ödemesi, hızlı kargo ve kolay iade ile
              ailelere güvenilir bir alışveriş deneyimi sunuyoruz.
            </p>
            <p className="mt-3 text-xs text-accent-gold font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              14 iş günü iade · {FREE_SHIPPING_THRESHOLD_TL} TL üzeri kargo bedava
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-display font-bold mb-4 text-accent-gold">Mağaza</h4>
            <ul className="space-y-2 text-sm text-brand-100">
              <li><Link to="/" className="hover:text-white transition-colors">Ana Sayfa</Link></li>
              <li><Link to="/en-cok-satanlar" className="hover:text-white transition-colors">Çok Satanlar</Link></li>
              <li><Link to="/kategoriler?hepsi=1" className="hover:text-white transition-colors">Tüm Ürünler</Link></li>
              <li><Link to="/kategoriler" className="hover:text-white transition-colors">Kategoriler</Link></li>
              <li><Link to="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="font-display font-bold mb-4 text-accent-gold">Müşteri Hizmetleri</h4>
            <ul className="space-y-2 text-sm text-brand-100">
              <li><Link to="/iletisim" className="hover:text-white transition-colors">İletişim</Link></li>
              <li><Link to="/sss" className="hover:text-white transition-colors">Sıkça Sorulan Sorular</Link></li>
              <li><Link to="/siparis-takip" className="hover:text-white transition-colors">Sipariş Takip</Link></li>
              <li>
                <Link to={isLoggedIn ? '/hesabim' : '/giris'} className="hover:text-white transition-colors">
                  {isLoggedIn ? 'Hesabım' : 'Giriş Yap'}
                </Link>
              </li>
              <li><Link to="/sepet" className="hover:text-white transition-colors">Sepetim</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="font-display font-bold mb-4 text-accent-gold">Yasal</h4>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2 text-sm text-brand-100">
              {FOOTER_PRIMARY_LEGAL.map((r) => (
                <li key={r.path}>
                  <Link to={r.path} className="hover:text-white transition-colors inline-block py-0.5">
                    {r.label}
                  </Link>
                </li>
              ))}
              {secondaryLegal.map((r) => (
                <li key={r.path} className="hidden lg:list-item">
                  <Link to={r.path} className="hover:text-white transition-colors inline-block py-0.5">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-brand-700/50 pt-8">
          <div className="space-y-4">
            <h4 className="font-display font-bold text-accent-gold text-sm uppercase tracking-wide">
              İletişim
            </h4>
            <ul className="space-y-3 text-sm text-brand-100">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 shrink-0 text-accent-gold mt-0.5" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 shrink-0 text-accent-gold mt-0.5" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors break-all">
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-accent-gold mt-0.5" />
                <span className="leading-relaxed">{address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 shrink-0 text-accent-gold mt-0.5" />
                <span>{BUSINESS_HOURS}</span>
              </li>
            </ul>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Destek
              </a>
            )}
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div>
              <h4 className="font-display font-bold text-accent-gold text-sm uppercase tracking-wide mb-3">
                Bizi Takip Edin
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                  @{INSTAGRAM_HANDLE}
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
                  aria-label="Facebook"
                >
                  Facebook
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
                >
                  TikTok
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
                >
                  YouTube
                </a>
              </div>
            </div>
            <p className="text-xs text-brand-300 leading-relaxed">
              {siteName} · İstanbul merkezli online oyuncak mağazası. Türkiye geneli hızlı kargo.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-brand-200 space-y-1 border-t border-brand-700/30 pt-6">
          <p className="font-semibold text-white">nasyoneltoys.com — tüm hakları saklıdır.</p>
          <p>© {new Date().getFullYear()} {siteName}</p>
          <p className="text-xs text-brand-400">Sürüm: {APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
