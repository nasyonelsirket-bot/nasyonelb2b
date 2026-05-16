import { MessageCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export default function WhatsAppFloat() {
  const { settings } = useStore();
  const phone = settings.whatsappNumber?.replace(/\D/g, '') || '905551234567';

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform hover:scale-110 touch-manipulation bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]"
      aria-label="WhatsApp ile iletişim"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
