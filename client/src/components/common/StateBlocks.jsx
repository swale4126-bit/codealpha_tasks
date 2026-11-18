import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  const Icon = icon || Inbox;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load content', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-slate-600">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
