import { useState, useId } from 'react';
import { ChevronRight } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faqContent';

export default function FaqSection() {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="sss" className="scroll-mt-24 bg-white border-t border-gray-200 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-brand-900">Sıkça Sorulan Sorular</h2>
        <ul className="mt-6 divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-btn-${i}`;
            return (
              <li key={item.q}>
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-3 text-left px-4 py-4 min-h-[44px] hover:bg-gray-50 transition focus-ring"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-brand-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    aria-hidden
                  />
                  <span className="font-medium text-brand-900 text-sm sm:text-base">{item.q}</span>
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-4 pb-4 pl-11 text-sm text-gray-600 leading-relaxed bg-gray-50/80"
                  >
                    {item.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
