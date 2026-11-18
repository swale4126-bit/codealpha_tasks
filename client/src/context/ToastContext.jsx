import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from './contexts.js';

const VARIANT_STYLES = {
  success: {
    container: 'border-emerald-200 bg-white text-slate-900',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  error: {
    container: 'border-red-200 bg-white text-slate-900',
    icon: AlertCircle,
    iconClass: 'text-red-600',
  },
  info: {
    container: 'border-brand-100 bg-white text-slate-900',
    icon: Info,
    iconClass: 'text-brand-500',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', durationMs = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (durationMs > 0) {
        setTimeout(() => dismissToast(id), durationMs);
      }
      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (msg) => showToast(msg, 'success'),
      error: (msg) => showToast(msg, 'error', 5000),
      info: (msg) => showToast(msg, 'info'),
      dismissToast,
    }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.type] || VARIANT_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${style.container}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
              <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
