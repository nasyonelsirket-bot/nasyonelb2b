import { Phone, Mail, MapPin, MessageCircle, Navigation, Clock } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import LocalBusinessSchema from '@/components/seo/LocalBusinessSchema';
import PaymentTrustStrip from '@/components/trust/PaymentTrustStrip';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/StoreContext';
import { getMapDirectionsUrl, getMapEmbedUrl } from '@/utils/categories';
import {
  BUSINESS_HOURS,
  COMPANY_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '@/constants/companyInfo';

export default function ContactPage() {
  const { settings } = useStore();
  const phone = settings.contactPhone || SUPPORT_PHONE;
  const email = settings.contactEmail || SUPPORT_EMAIL;
  const address = settings.contactAddress || COMPANY_ADDRESS;
  const waPhone = settings.whatsappNumber?.replace(/\D/g, '');
  const mapQuery = settings.contactMapQuery || address;
  const directionsUrl = getMapDirectionsUrl(mapQuery);
  const embedUrl = getMapEmbedUrl(mapQuery);

  return (
    <>
      <SEO
        title="İletişim"
        description="Nasyonel Toys iletişim bilgileri — telefon, e-posta, WhatsApp destek ve İstanbul adres."
        path="/iletisim"
      />
      <LocalBusinessSchema />

      <div className="bg-gradient-to-b from-brand-50 to-white border-b border-brand-100">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-900">İletişim</h1>
          <p className="mt-2 text-brand-600 max-w-2xl">
            Sipariş, ödeme ve teslimat sorularınız için müşteri hizmetlerimize ulaşın. Güvenli alışveriş
            deneyiminiz bizim önceliğimiz.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <div className="space-y-5">
            {[
              {
                icon: Phone,
                label: 'Müşteri Destek Hattı',
                value: phone,
                href: `tel:${phone.replace(/\s/g, '')}`,
              },
              {
                icon: Mail,
                label: 'E-posta',
                value: email,
                href: `mailto:${email}`,
              },
              {
                icon: MapPin,
                label: 'Adres (İstanbul)',
                value: address,
              },
              {
                icon: Clock,
                label: 'Çalışma Saatleri',
                value: BUSINESS_HOURS,
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-brand-900">{label}</p>
                  {href ? (
                    <a href={href} className="text-gray-600 hover:text-brand-800 transition-colors break-all">
                      {value}
                    </a>
                  ) : (
                    <p className="text-gray-600 leading-relaxed">{value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
              {waPhone && (
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="whatsapp" size="lg" className="w-full sm:w-auto">
                    <MessageCircle className="h-5 w-5" /> WhatsApp Destek
                  </Button>
                </a>
              )}
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Navigation className="h-5 w-5" />
                  Haritada Gör
                </Button>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-brand-200 shadow-card aspect-[4/3] min-h-[280px]">
              <iframe
                title="Nasyonel Toys konum haritası"
                src={embedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-gray-500 text-center leading-relaxed">{address}</p>
          </div>
        </div>

        <PaymentTrustStrip className="mt-12" />

        <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 sm:p-8 text-center">
          <h2 className="font-display text-lg font-bold text-brand-900">Hızlı destek</h2>
          <p className="mt-2 text-sm text-brand-600 max-w-xl mx-auto">
            Sipariş ve ödeme sorularınız için{' '}
            <a href={`mailto:${email}`} className="text-brand-800 underline">
              {email}
            </a>{' '}
            adresine yazabilir veya WhatsApp hattımızdan anında yanıt alabilirsiniz.
          </p>
        </div>
      </div>
    </>
  );
}
