import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Ayşe K.',
    text: 'Kargo çok hızlı geldi, ürünler kaliteli. Çocuğum çok mutlu!',
    rating: 5,
  },
  {
    name: 'Mehmet T.',
    text: 'Toptan fiyatlar gerçekten iyi. WhatsApp ile sipariş çok pratik.',
    rating: 5,
  },
  {
    name: 'Elif Y.',
    text: 'Eğitici oyuncak seçimi harika. Güvenle alışveriş yaptık.',
    rating: 5,
  },
];

export default function HomeSocialProof() {
  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map((r) => (
            <article
              key={r.name}
              className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <Quote className="h-8 w-8 text-accent-gold/40 mb-2" aria-hidden />
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent-gold text-accent-gold" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
              <p className="mt-3 text-xs font-semibold text-brand-800">{r.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
