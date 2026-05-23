import { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faqContent';

export default function FooterFaqAccordion() {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(-1);
  const baseId = useId();

  return (
    <li className="pt-1">
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left hover:text-white font-medium min-h-[44px] focus-ring"
        aria-expanded={sectionOpen}
        aria-controls={`${baseId}-faq-list`}
      >
        Sıkça Sorulan Sorular
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${sectionOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {sectionOpen && (
        <ul id={`${baseId}-faq-list`} className="mt-2 space-y-1 border-l border-brand-600/50 pl-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            const panelId = `${baseId}-panel-${i}`;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="text-left text-xs hover:text-white w-full py-2 min-h-[44px] focus-ring"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  {item.q}
                </button>
                {isOpen && (
                  <p id={panelId} className="text-xs text-brand-100 leading-relaxed pb-2 pr-1">
                    {item.a}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
