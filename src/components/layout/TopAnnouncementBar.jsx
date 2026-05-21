import { useEffect, useState } from 'react';
import { TOP_ANNOUNCEMENTS, ANNOUNCEMENT_ROTATE_MS } from '@/constants/topAnnouncements';

export default function TopAnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let swapTimer;
    const id = setInterval(() => {
      setVisible(false);
      swapTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % TOP_ANNOUNCEMENTS.length);
        setVisible(true);
      }, 280);
    }, ANNOUNCEMENT_ROTATE_MS);
    return () => {
      clearInterval(id);
      clearTimeout(swapTimer);
    };
  }, []);

  const item = TOP_ANNOUNCEMENTS[index];

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white text-center text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 font-medium min-h-[2rem] sm:min-h-[2.25rem] flex items-center justify-center"
      aria-live="polite"
    >
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 transition-all duration-300 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {item.rest && <span className="text-white/95">{item.rest}</span>}
        <span className="font-bold tracking-wide drop-shadow-sm">{item.highlight}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 overflow-hidden">
        <div
          key={index}
          className="h-full bg-white/80 origin-left animate-announcement-progress"
          style={{ animationDuration: `${ANNOUNCEMENT_ROTATE_MS}ms` }}
        />
      </div>
    </div>
  );
}
