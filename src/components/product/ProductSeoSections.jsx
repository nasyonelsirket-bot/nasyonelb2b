import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import FaqSchema from '@/components/seo/FaqSchema';
import {
  getProductFeatures,
  getProductFaqs,
  getProductSeoParagraphs,
} from '@/utils/productSeoContent';

function SeoAccordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-brand-100 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-brand-900 hover:bg-brand-50/50"
      >
        {title}
        <span className="text-brand-500 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-brand-50">
          {children}
        </div>
      )}
    </div>
  );
}

/** Ürün detay — SEO özellikler, zengin açıklama, SSS */
export default function ProductSeoSections({ product }) {
  const features = useMemo(() => getProductFeatures(product), [product]);
  const faqs = useMemo(() => getProductFaqs(product), [product]);
  const paragraphs = useMemo(() => getProductSeoParagraphs(product), [product]);

  if (!product) return null;

  return (
    <div className="mt-8 space-y-3">
      <FaqSchema items={faqs} />

      <SeoAccordion title="Ürün Özellikleri" defaultOpen>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </SeoAccordion>

      <SeoAccordion title="Detaylı Ürün Bilgisi" defaultOpen>
        <div className="space-y-4 max-w-none text-gray-600">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </SeoAccordion>

      <SeoAccordion title="Sık Sorulan Sorular">
        <ul className="divide-y divide-gray-100">
          {faqs.map((item) => (
            <li key={item.q} className="py-3 first:pt-0 last:pb-0">
              <p className="font-medium text-brand-900">{item.q}</p>
              <p className="mt-1 text-gray-600">{item.a}</p>
            </li>
          ))}
        </ul>
      </SeoAccordion>
    </div>
  );
}
