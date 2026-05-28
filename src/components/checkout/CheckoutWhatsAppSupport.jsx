import { MessageCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { WHATSAPP_DISPLAY } from '@/constants/companyInfo';

function buildWaLink(number) {
  const phone = String(number || '').replace(/\D/g, '');
  if (!phone) return null;
  const text = encodeURIComponent('Merhaba, siparişim hakkında destek almak istiyorum.');
  return `https://wa.me/${phone}?text=${text}`;
}

/** Checkout alt kısmı — WhatsApp destek CTA */
export default function CheckoutWhatsAppSupport({ className = '' }) {
  const { settings } = useStore();
  const href = buildWaLink(settings.whatsappNumber);
  if (!href) return null;

  return (
    <div className={`checkout-whatsapp-support ${className}`.trim()}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-bold text-emerald-900 hover:bg-emerald-100 active:scale-[0.99] transition-colors"
      >
        <MessageCircle className="h-5 w-5 text-[#25D366] shrink-0" aria-hidden />
        <span>
          WhatsApp Destek
          {WHATSAPP_DISPLAY ? (
            <span className="font-normal text-emerald-800/90"> · {WHATSAPP_DISPLAY}</span>
          ) : null}
        </span>
      </a>
      <p className="mt-2 text-center text-[11px] text-gray-500">
        Sipariş veya ödeme konusunda yardım mı lazım? Hemen yazın.
      </p>
    </div>
  );
}
