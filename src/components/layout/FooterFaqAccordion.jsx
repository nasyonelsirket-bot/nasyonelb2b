import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faqContent';

export default function FooterFaqAccordion() {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <li className="pt-1">
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left hover:text-white font-medium"
      >
        Sıkça Sorulan Sorular
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${sectionOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {sectionOpen && (
        <ul className="mt-2 space-y-1 border-l border-brand-600/50 pl-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="text-left text-xs hover:text-white w-full py-1"
                >
                  {item.q}
                </button>
                {isOpen && (
                  <p className="text-xs text-brand-200 leading-relaxed pb-2 pr-1">{item.a}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
