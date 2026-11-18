const STYLES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  neutral: 'bg-stone-100 text-slate-700 ring-slate-500/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[variant] || STYLES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
