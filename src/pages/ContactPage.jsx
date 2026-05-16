import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/StoreContext';

export default function ContactPage() {
  const { settings } = useStore();
  const phone = settings.whatsappNumber?.replace(/\D/g, '');

  return (
    <>
      <SEO title="İletişim" description="B2B oyuncak katalog iletişim bilgileri" path="/iletisim" />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-brand-900">İletişim</h1>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              { icon: Phone, label: 'Telefon', value: settings.contactPhone },
              { icon: Mail, label: 'E-posta', value: settings.contactEmail },
              { icon: MapPin, label: 'Adres', value: settings.contactAddress },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-brand-900">{label}</p>
                  <p className="text-gray-600">{value}</p>
                </div>
              </div>
            ))}
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg">
                <MessageCircle className="h-5 w-5" /> WhatsApp ile Yazın
              </Button>
            </a>
          </div>
          <form className="rounded-2xl border border-brand-100 bg-white p-8 shadow-card space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input className="w-full rounded-lg border border-brand-200 px-4 py-2.5" placeholder="Firma Adı" />
            <input className="w-full rounded-lg border border-brand-200 px-4 py-2.5" placeholder="E-posta" type="email" />
            <textarea className="w-full rounded-lg border border-brand-200 px-4 py-2.5 h-32" placeholder="Mesajınız" />
            <Button variant="primary" className="w-full">Gönder</Button>
            <p className="text-xs text-gray-400 text-center">Sipariş için doğrudan WhatsApp kullanın</p>
          </form>
        </div>
      </div>
    </>
  );
}
