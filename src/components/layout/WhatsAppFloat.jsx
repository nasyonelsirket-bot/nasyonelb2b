import { MessageCircle, Phone } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const CALL_CENTER_TEL = '+908503056134';

export default function WhatsAppFloat() {
  const { settings } = useStore();
  const phone = settings.whatsappNumber?.replace(/\D/g, '') || '905551234567';

  const floatBtn =
    'flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 touch-manipulation';

  return (
    <div className="fixed z-50 flex flex-col gap-3 bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]">
      <a
        href={`tel:${CALL_CENTER_TEL}`}
        className={`${floatBtn} bg-red-600 shadow-red-600/40`}
        aria-label="0850 305 61 34 numarayı ara"
      >
        <Phone className="h-8 w-8" />
      </a>
      <a
        href={`https://wa.me/${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${floatBtn} bg-[#25D366] shadow-[#25D366]/40`}
        aria-label="WhatsApp ile iletişim"
      >
        <MessageCircle className="h-8 w-8" />
      </a>
    </div>
  );
}
