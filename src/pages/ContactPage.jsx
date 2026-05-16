import { Phone, Mail, MapPin, MessageCircle, Navigation } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/StoreContext';
import { getMapDirectionsUrl, getMapEmbedUrl, MAP_ADDRESS } from '@/utils/categories';

export default function ContactPage() {
  const { settings } = useStore();
  const phone = settings.whatsappNumber?.replace(/\D/g, '');
  const address = settings.contactAddress || MAP_ADDRESS;
  const mapQuery = settings.contactMapQuery || address;
  const directionsUrl = getMapDirectionsUrl(mapQuery);
  const embedUrl = getMapEmbedUrl(mapQuery);

  return (
    <>
      <SEO title="İletişim" description="Nasyonel Toys B2B iletişim ve adres bilgileri" path="/iletisim" />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-brand-900">İletişim</h1>
        <p className="mt-2 text-brand-600">Nasyonel Toys — B2B toptan oyuncak</p>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              { icon: Phone, label: 'Telefon', value: settings.contactPhone },
              { icon: Mail, label: 'E-posta', value: settings.contactEmail },
              { icon: MapPin, label: 'Adres', value: address },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-brand-900">{label}</p>
                  <p className="text-gray-600 leading-relaxed">{value}</p>
                </div>
              </div>
            ))}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="lg">
                <Navigation className="h-5 w-5" />
                Google Haritalar — Nasıl Giderim?
              </Button>
            </a>

            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="whatsapp" size="lg">
                <MessageCircle className="h-5 w-5" /> WhatsApp ile Yazın
              </Button>
            </a>
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
            <p className="text-xs text-gray-500 text-center">
              Oruçreis, Giyimkent 17. Sk. 35/a — Esenler / İstanbul
            </p>
          </div>
        </div>

        <form
          className="mt-12 rounded-2xl border border-brand-100 bg-white p-8 shadow-card space-y-4 max-w-xl"
          onSubmit={(e) => e.preventDefault()}
        >
          <h2 className="font-semibold text-brand-900">Mesaj gönderin</h2>
          <input className="w-full rounded-lg border border-brand-200 px-4 py-2.5" placeholder="Firma Adı" />
          <input className="w-full rounded-lg border border-brand-200 px-4 py-2.5" placeholder="E-posta" type="email" />
          <textarea className="w-full rounded-lg border border-brand-200 px-4 py-2.5 h-32" placeholder="Mesajınız" />
          <Button variant="primary" className="w-full">Gönder</Button>
          <p className="text-xs text-gray-400 text-center">Sipariş için doğrudan WhatsApp kullanın</p>
        </form>
      </div>
    </>
  );
}
