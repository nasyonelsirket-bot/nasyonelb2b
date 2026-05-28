import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';

function buildWaLink(number) {
  const phone = String(number || '').replace(/\D/g, '');
  if (!phone) return null;
  const text = encodeURIComponent('Merhaba, Nasyonel Toys hakkında bilgi almak istiyorum.');
  return `https://wa.me/${phone}?text=${text}`;
}

/** Mobil WhatsApp hızlı destek — checkout/admin hariç */
export default function WhatsAppFab() {
  const { settings } = useStore();
  const { pathname } = useLocation();
  const href = buildWaLink(settings.whatsappNumber);

  if (!href) return null;
  if (pathname.startsWith('/admin') || pathname.startsWith('/odeme')) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="lg:hidden fixed z-[46] right-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/25 hover:scale-105 active:scale-95 transition-transform"
      style={{ bottom: 'calc(7.25rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="WhatsApp ile destek al"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
