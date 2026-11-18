import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Kora<span className="text-brand-500">Market</span>
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <Outlet />
      </div>
      <p className="mt-6 text-xs text-slate-500">
        <Link to="/" className="font-medium text-brand-600 hover:underline">
          &larr; Return to KoraMarket Storefront
        </Link>
      </p>
    </div>
  );
}
