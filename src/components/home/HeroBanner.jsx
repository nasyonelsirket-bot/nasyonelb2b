import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import Button from '@/components/ui/Button';

export default function HeroBanner() {
  const { banners } = useStore();
  const active = banners.filter((b) => b.active !== false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (active.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % active.length), 6000);
    return () => clearInterval(t);
  }, [active.length]);

  if (!active.length) return null;

  const current = active[index];

  return (
    <section className="relative overflow-hidden rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-6 max-w-7xl lg:mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="relative aspect-[21/9] min-h-[280px] sm:min-h-[360px]"
        >
          <img
            src={current.image}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 via-brand-900/70 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 lg:px-16 max-w-2xl">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            >
              {current.title}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-lg text-brand-200"
            >
              {current.subtitle}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Link to={current.link || '/kampanyalar'}>
                <Button variant="secondary" size="lg">
                  Keşfet <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {active.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + active.length) % active.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % active.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {active.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
