import {
  Shield,
  Lock,
  Truck,
  MapPin,
  Heart,
  Building2,
  Globe2,
  Boxes,
} from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

const TRUST_ITEMS = [
  { icon: Shield, title: 'Güvenli alışveriş', desc: '256 bit SSL koruması' },
  { icon: Lock, title: 'SSL koruması', desc: 'Ödeme bilgileriniz şifreli' },
  { icon: Truck, title: 'Hızlı teslimat', desc: 'Stoktan aynı gün çıkış' },
  { icon: MapPin, title: 'Türkiye geneli', desc: '81 ile gönderim' },
  { icon: Heart, title: 'Müşteri memnuniyeti', desc: '100.000+ mutlu aile' },
  { icon: Building2, title: 'Toptan & perakende', desc: 'Esnek sipariş adedi' },
  { icon: Globe2, title: 'İthalatçı firma', desc: 'Doğrudan tedarik avantajı' },
  { icon: Boxes, title: 'Stoktan gönderim', desc: 'Hızlı sevkiyat' },
];

export default function HomeTrustSection() {
  return (
    <section className="bg-white border-y border-brand-100 py-8 sm:py-10" aria-label="Güven ve hizmet">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Neden Nasyonel Toys?</p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-900 mt-1">
            Güvenle alışveriş yapın
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-xl mx-auto">
            {FREE_SHIPPING_THRESHOLD_TL} TL üzeri kargo bedava · kapıda ödeme · hızlı iade süreci
          </p>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="flex flex-col items-center text-center rounded-xl border border-brand-100 bg-brand-50/50 px-2 py-4 transition-shadow hover:shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-brand-700 mb-2">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-xs font-bold text-brand-900 leading-tight">{title}</span>
              <span className="text-[10px] text-gray-500 mt-0.5 leading-snug">{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
