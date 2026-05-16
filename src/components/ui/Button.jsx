export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/25',
    secondary:
      'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50',
    outline:
      'border-2 border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white',
    ghost: 'text-brand-700 hover:bg-brand-50',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
