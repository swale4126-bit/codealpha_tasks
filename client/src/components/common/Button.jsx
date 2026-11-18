import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500 shadow-xs',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 shadow-xs',
  outline:
    'border border-stone-300 bg-white text-slate-800 hover:bg-stone-50 focus-visible:ring-brand-500',
  ghost: 'text-slate-700 hover:bg-stone-100 hover:text-slate-900 focus-visible:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-xs',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
