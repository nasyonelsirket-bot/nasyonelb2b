import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HelpCircle } from 'lucide-react';
import FaqSchema from '@/components/seo/FaqSchema';
import SEO from '@/components/seo/SEO';
import { FAQ_ITEMS } from '@/data/faqContent';

export default function FaqPage() {
  const [open, setOpen] = useState(0);

  return (
    <>
      <SEO
        title="Sıkça Sorulan Sorular"
        description="Kargo, iade, PayTR güvenli ödeme ve sipariş takibi hakkında sıkça sorulan sorular."
        path="/sss"
      />
      <FaqSchema items={FAQ_ITEMS} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
            <HelpCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900">
              Sıkça Sorulan Sorular
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kargo, iade, ödeme ve sipariş süreçleri hakkında yanıtlar
            </p>
          </div>
        </div>

        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-card">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-start gap-3 text-left px-4 sm:px-6 py-4 hover:bg-brand-50/80 transition"
                >
                  <ChevronRight
                    className={`h-5 w-5 shrink-0 text-brand-600 mt-0.5 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                  <span className="font-medium text-brand-900 text-sm sm:text-base">{item.q}</span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-5 pl-12 sm:pl-14 text-sm text-gray-600 leading-relaxed bg-gray-50/80 border-t border-gray-100">
                    {item.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-sm text-gray-600">
          Sorunuz mu var?{' '}
          <Link to="/iletisim" className="font-semibold text-brand-700 hover:underline">
            İletişim
          </Link>{' '}
          ·{' '}
          <Link to="/siparis-takip" className="font-semibold text-brand-700 hover:underline">
            Sipariş takip
          </Link>
        </p>
      </div>
    </>
  );
}
