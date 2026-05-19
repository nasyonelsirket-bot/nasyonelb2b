<<<<<<< HEAD
export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-100 text-brand-800',
    new: 'bg-emerald-500 text-white',
    campaign: 'bg-accent-gold text-brand-950',
    min: 'bg-brand-800/90 text-white',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
=======
export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-100 text-brand-800',
    new: 'bg-emerald-500 text-white',
    campaign: 'bg-accent-gold text-brand-950',
    min: 'bg-brand-800/90 text-white',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
>>>>>>> 4d1702da50b32d1e25ef371646e044a4b268a938
