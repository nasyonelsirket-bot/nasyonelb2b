import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * @param {{ items: Array<{ label: string, to?: string }>, className?: string, variant?: 'dark' | 'light' }} props
 */
export default function Breadcrumbs({ items, className = '', variant = 'dark' }) {
  if (!items?.length) return null;

  const linkClass = variant === 'light' ? 'hover:text-brand-800 text-brand-600' : 'hover:text-white';
  const lastClass = variant === 'light' ? 'font-medium text-brand-900' : 'font-medium text-white';

  return (
    <nav aria-label="Breadcrumb" className={`text-xs sm:text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
              {item.to && !isLast ? (
                <Link to={item.to} className={`truncate max-w-[140px] sm:max-w-none ${linkClass}`}>
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate max-w-[160px] sm:max-w-none ${isLast ? lastClass : ''}`}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
